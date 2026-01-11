// hello_vitals.cpp
// SmartSpectra Hello Vitals - Data Logging Example

#include <smartspectra/container/foreground_container.hpp>
#include <smartspectra/container/settings.hpp>
#include <smartspectra/gui/opencv_hud.hpp>
#include <physiology/modules/messages/metrics.h>
#include <physiology/modules/messages/status.h>
#include <glog/logging.h>
#include <opencv2/opencv.hpp>
#include <iostream>
#include <fstream>
#include <vector>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <ctime>

#include <mutex>

using namespace presage::smartspectra;

// Helper to get formatted timestamp removed

// State management for logging
struct SessionManager {
    bool is_recording = false;
    int question_counter = 1;
    int session_sample_counter = 0; 
    
    // Session data
    std::vector<float> session_pulses;
    std::vector<float> session_breathings;
    std::chrono::steady_clock::time_point start_time;
    std::ofstream raw_log;
    std::ofstream events_log;

    SessionManager() {
        // Initialize Raw Log
        raw_log.open("raw_vitals_log.csv", std::ios::out);
        if (raw_log.is_open()) {
            raw_log << "sample_index,question_number,timestamp,pulse_bpm,breathing_bpm,pulse_confidence\n";
            raw_log.flush();
            std::cout << "[INFO] Fresh raw_vitals_log.csv initialized.\n";
        }
        
        // Initialize Events Log
        events_log.open("interview_events.json", std::ios::out);
        if (events_log.is_open()) {
            std::cout << "[INFO] Fresh interview_events.json initialized.\n";
        }
    }

    void StartSession() {
        is_recording = true;
        session_sample_counter = 0; // Reset for new question
        session_pulses.clear();
        session_breathings.clear();
        
        start_time = std::chrono::steady_clock::now();
        std::cout << "\n[MANUAL-SESSION START] Recording Question " << question_counter << "...\n";
    }

    void EndSession() {
        is_recording = false;
        auto end_time = std::chrono::steady_clock::now();
        double duration = std::chrono::duration<double>(end_time - start_time).count();

        if (session_pulses.empty()) {
            std::cout << "[MANUAL-SESSION END] No data was collected. Skipping summary.\n";
            return;
        }

        // Calculate Session Averages
        float avg_pulse = 0;
        for (float f : session_pulses) avg_pulse += f;
        avg_pulse /= session_pulses.size();

        float avg_breathing = 0;
        for (float f : session_breathings) avg_breathing += f;
        avg_breathing /= session_breathings.size();

        std::cout << "\n[MANUAL-SESSION END] Summary for Question " << question_counter << ":\n";
        std::cout << "  - Avg Pulse: " << std::fixed << std::setprecision(2) << avg_pulse << " BPM\n";
        std::cout << "  - Avg Breathing: " << avg_breathing << " BPM\n";
        std::cout << "  - Duration: " << std::setprecision(2) << duration << "s\n";

        // Write JSON Summary
        std::string filename = "question_" + std::to_string(question_counter) + "_summary.json";
        std::ofstream json_out(filename);
        if (json_out.is_open()) {
            json_out << "{\n"
                     << "  \"question_number\": " << question_counter << ",\n"
                     << "  \"avg_pulse\": " << avg_pulse << ",\n"
                     << "  \"avg_breathing\": " << avg_breathing << ",\n"
                     << "  \"session_duration_sec\": " << duration << ",\n"
                     << "  \"sample_count\": " << session_pulses.size() << "\n"
                     << "}\n";
            json_out.close();
        }

        question_counter++;
    }
    
    void ProcessMetrics(const presage::physiology::MetricsBuffer& metrics) {
        if (!is_recording) return;

        float pulse = 0, breathing = 0, confidence = 0;
        int64_t timestamp = 0;
        bool has_pulse = !metrics.pulse().rate().empty();
        bool has_breathing = !metrics.breathing().rate().empty();

        if (has_pulse) {
            auto it = metrics.pulse().rate().rbegin();
            pulse = it->value();
            confidence = it->confidence();
            timestamp = it->timestamp();
            session_pulses.push_back(pulse);
        }
        if (has_breathing) {
            breathing = metrics.breathing().rate().rbegin()->value();
            session_breathings.push_back(breathing);
        }
        
        session_sample_counter++;

        // --- Raw Log ---
        if (raw_log.is_open()) {
            // Use session_sample_counter in the CSV to match the JSON event logic
            raw_log << session_sample_counter << "," << question_counter << "," << timestamp << "," 
                    << pulse << "," << breathing << "," << confidence << "\n";
            raw_log.flush();
        }
    }
};

int main(int argc, char** argv) {
    // Initialize logging
    google::InitGoogleLogging(argv[0]);
    FLAGS_alsologtostderr = true;
    
    // Get API key
    std::string api_key;
    if (argc > 1) {
        api_key = argv[1];
    } else if (const char* env_key = std::getenv("SMARTSPECTRA_API_KEY")) {
        api_key = env_key;
    } else {
        std::cout << "Usage: ./hello_vitals YOUR_API_KEY\n";
        return 1;
    }
    
    SessionManager session_manager;
    std::cout << "Starting SmartSpectra Hello Vitals with Logging...\n";
    
    try {
        container::settings::Settings<
            container::settings::OperationMode::Continuous,
            container::settings::IntegrationMode::Rest
        > settings;
        
        settings.video_source.device_index = 0;
        settings.video_source.capture_width_px = 1280;
        settings.video_source.capture_height_px = 720;
        settings.video_source.codec = presage::camera::CaptureCodec::MJPG;
        settings.video_source.auto_lock = true;
        
        settings.headless = false;
        settings.enable_edge_metrics = true;
        settings.integration.api_key = api_key;
        
        // Fix for initialization error: buffer must be > 0.2s
        settings.continuous.preprocessed_data_buffer_duration_s = 0.5;
        
        auto container = std::make_unique<container::CpuContinuousRestForegroundContainer>(settings);
        auto hud = std::make_unique<gui::OpenCvHud>(10, 0, 1260, 400);
        
        auto status = container->SetOnCoreMetricsOutput(
            [&hud, &session_manager](const presage::physiology::MetricsBuffer& metrics, int64_t timestamp) {
                bool has_data = !metrics.pulse().rate().empty() && !metrics.breathing().rate().empty();

                // Auto-session management removed for manual 'a' key control
                if (session_manager.is_recording) {
                    session_manager.ProcessMetrics(metrics);
                }
                
                // Real-time terminal output - Now on a new line
                if (has_data) {
                    float pulse = metrics.pulse().rate().rbegin()->value();
                    float breathing = metrics.breathing().rate().rbegin()->value();
                    std::cout << "Vitals - Pulse: " << std::fixed << std::setprecision(1) << pulse 
                              << " BPM, Breathing: " << breathing << " BPM (Recording: " 
                              << (session_manager.is_recording ? "ON" : "OFF") << ")\n";
                }

                hud->UpdateWithNewMetrics(metrics);
                return absl::OkStatus();
            }
        ); 
        
        status = container->SetOnVideoOutput(
            [&hud, &session_manager](cv::Mat& frame, int64_t timestamp) {
                hud->Render(frame).IgnoreError();
                
                // Overlay recording status
                if (session_manager.is_recording) {
                    cv::circle(frame, cv::Point(50, 50), 10, cv::Scalar(0, 0, 255), -1);
                    cv::putText(frame, "MANUAL-REC Q" + std::to_string(session_manager.question_counter), 
                                cv::Point(70, 60), cv::FONT_HERSHEY_SIMPLEX, 0.8, cv::Scalar(0, 0, 255), 2);
                }

                cv::imshow("SmartSpectra Hello Vitals", frame);
                
                int key = cv::waitKey(1) & 0xFF;
                if (key == 'q' || key == 27) {
                    return absl::CancelledError("User quit");
                } else if (key == 'a') {
                    if (session_manager.is_recording) {
                        session_manager.EndSession();
                    } else {
                        session_manager.StartSession();
                    }
                }
                return absl::OkStatus();
            }
        ); 
        
        if (auto status = container->Initialize(); !status.ok()) {
            std::cerr << "Failed to initialize: " << status.message() << "\n";
            return 1;
        }
        
        std::cout << "Ready! Press 'a' to start/stop recording data for each question.\nPress 'q' to quit.\n";
        container->Run().IgnoreError();
        
        cv::destroyAllWindows();
        return 0;
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }
}
