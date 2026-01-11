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
#include <filesystem>

// MJPEG Streamer
#include <nadjieb/mjpeg_streamer.hpp>

#include <mutex>

using namespace presage::smartspectra;

// Helper struct for Pulse/Breathing Summary
struct QuestionSummary {
    int question_number;
    double avg_pulse;
    double avg_breathing;
    double duration;
    size_t sample_count;
};

// Helper struct for Stress Events
struct StressEvent {
    int question_number;
    double time_offset_sec; // Seconds from start of question
    std::string type;       // "Pulse" or "Breathing"
    float value;
};

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
    
    // Aggregated Summaries
    std::vector<QuestionSummary> all_summaries;
    
    // Stress Events
    std::vector<StressEvent> stress_events;

    SessionManager() {
        // Initialize Raw Log
        raw_log.open("raw_vitals_log.csv", std::ios::out);
        if (raw_log.is_open()) {
            raw_log << "sample_index,question_number,timestamp,pulse_bpm,breathing_bpm,pulse_confidence\n";
            raw_log.flush();
            std::cout << "[INFO] Fresh raw_vitals_log.csv initialized.\n";
        }
        
        // Clear previous analysis
        std::ofstream json_clear("interview_events.json", std::ios::out | std::ios::trunc);
        json_clear << "[]";
        json_clear.close();
        
        // Clear previous stress events
        std::ofstream stress_clear("stress_events.json", std::ios::out | std::ios::trunc);
        stress_clear << "[]";
        stress_clear.close();
    }

    void StartSession() {
        if (is_recording) return; // Prevent double start
        is_recording = true;
        session_sample_counter = 0; // Reset for new question
        session_pulses.clear();
        session_breathings.clear();
        
        start_time = std::chrono::steady_clock::now();
        std::cout << "\n[SESSION START] Recording Question " << question_counter << "...\n";
    }

    void EndSession() {
        if (!is_recording) return;

        is_recording = false;
        auto end_time = std::chrono::steady_clock::now();
        double duration = std::chrono::duration<double>(end_time - start_time).count();

        if (session_pulses.empty()) {
            std::cout << "[SESSION END] No data was collected for Q" << question_counter << ".\n";
        } else {
            // Calculate Session Averages
            float avg_pulse = 0;
            for (float f : session_pulses) avg_pulse += f;
            avg_pulse /= session_pulses.size();

            float avg_breathing = 0;
            for (float f : session_breathings) avg_breathing += f;
            avg_breathing /= session_breathings.size();

            std::cout << "\n[SESSION END] Summary for Question " << question_counter << ":\n";
            std::cout << "  - Avg Pulse: " << std::fixed << std::setprecision(2) << avg_pulse << " BPM\n";
            std::cout << "  - Avg Breathing: " << avg_breathing << " BPM\n";
            std::cout << "  - Duration: " << std::setprecision(2) << duration << "s\n";

            // Store Summary
            all_summaries.push_back({question_counter, avg_pulse, avg_breathing, duration, session_pulses.size()});

            // Write Aggregated JSON
            WriteAggregatedJSON();
        }

        question_counter++;
    }

    void WriteAggregatedJSON() {
        std::ofstream json_out("interview_events.json"); // Overwrite with full array
        if (json_out.is_open()) {
            json_out << "[\n";
            for (size_t i = 0; i < all_summaries.size(); ++i) {
                const auto& s = all_summaries[i];
                json_out << "  {\n"
                         << "    \"question_number\": " << s.question_number << ",\n"
                         << "    \"avg_pulse\": " << s.avg_pulse << ",\n"
                         << "    \"avg_breathing\": " << s.avg_breathing << ",\n"
                         << "    \"session_duration_sec\": " << s.duration << ",\n"
                         << "    \"sample_count\": " << s.sample_count << "\n"
                         << "  }" << (i < all_summaries.size() - 1 ? "," : "") << "\n";
            }
            json_out << "]\n";
            json_out.close();
            std::cout << "[INFO] Updated interview_events.json with Q" << (question_counter) << " data.\n";
        }
    }
    
    void RecordStressEvent(const StressEvent& event) {
        stress_events.push_back(event);
        
        // Write/Update Stress JSON immediately
        std::ofstream json_out("stress_events.json");
        if (json_out.is_open()) {
            json_out << "[\n";
            for (size_t i = 0; i < stress_events.size(); ++i) {
                const auto& s = stress_events[i];
                json_out << "  {\n"
                         << "    \"question_number\": " << s.question_number << ",\n"
                         << "    \"time_offset_sec\": " << std::fixed << std::setprecision(2) << s.time_offset_sec << ",\n"
                         << "    \"type\": \"" << s.type << "\",\n"
                         << "    \"value\": " << s.value << "\n"
                         << "  }" << (i < stress_events.size() - 1 ? "," : "") << "\n";
            }
            json_out << "]\n";
            json_out.close();
        }
    }
    
    void ProcessMetrics(const presage::physiology::MetricsBuffer& metrics) {
        if (!is_recording) return;

        float pulse = 0, breathing = 0, confidence = 0;
        int64_t timestamp = 0;
        bool has_pulse = !metrics.pulse().rate().empty();
        bool has_breathing = !metrics.breathing().rate().empty();

        double offset_sec = std::chrono::duration<double>(std::chrono::steady_clock::now() - start_time).count();

        if (has_pulse) {
            auto it = metrics.pulse().rate().rbegin();
            pulse = it->value();
            confidence = it->confidence();
            timestamp = it->timestamp();
            session_pulses.push_back(pulse);
            
            // Stress Check Pulse > 100
            if (pulse > 100.0f) {
                RecordStressEvent({question_counter, offset_sec, "Pulse", pulse});
            }
        }
        if (has_breathing) {
            breathing = metrics.breathing().rate().rbegin()->value();
            session_breathings.push_back(breathing);
            
            // Stress Check Breathing > 20
            if (breathing > 20.0f) {
                RecordStressEvent({question_counter, offset_sec, "Breathing", breathing});
            }
        }
        
        session_sample_counter++;

        // --- Raw Log ---
        if (raw_log.is_open()) {
            raw_log << session_sample_counter << "," << question_counter << "," << timestamp << "," 
                    << pulse << "," << breathing << "," << confidence << "\n";
            raw_log.flush();
        }
    }
};

// Subclass to expose protected 'recording' member
class ExposedContainer : public container::CpuContinuousRestForegroundContainer {
public:
    using container::CpuContinuousRestForegroundContainer::CpuContinuousRestForegroundContainer;

    void SetRecordingPublic(bool enable) {
        this->recording = enable;
    }
};

#include <deque>

// Helper struct for Data Smoothing (Simple Moving Average)
struct Smoother {
    std::deque<float> history;
    size_t window_size;

    Smoother(size_t size = 15) : window_size(size) {}

    float Update(float new_val) {
        if (new_val == 0) return 0; // Ignore zeros or handle them? For now, pass through or ignore. 
                                    // Actually, let's reset if 0 to avoid dragging down average?
                                    // Or just push. SmartSpectra returns 0 if no vitals.
        if (new_val <= 1.0f) return 0; // Filter noise/initialization

        history.push_back(new_val);
        if (history.size() > window_size) history.pop_front();
        
        float sum = 0;
        for (float v : history) sum += v;
        return sum / history.size();
    }
};

int main(int argc, char** argv) {
    // Initialize logging
    google::InitGoogleLogging(argv[0]);
    FLAGS_alsologtostderr = true;

    // Cleanup stale trigger file
    if (std::filesystem::exists("../vitals_trigger.tmp")) {
        std::filesystem::remove("../vitals_trigger.tmp");
    }
    
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
    
    // Create Smoothers
    // Window size 10 (approx 0.3-0.5s) for responsive yet stable readings
    Smoother pulse_smoother(10);
    Smoother breathing_smoother(10);

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
        
        // set to false to ensure video callbacks still fire for streaming
        settings.headless = false;
        settings.enable_edge_metrics = true;
        settings.integration.api_key = api_key;
        
        // Fix for initialization error: buffer must be > 0.2s
        settings.continuous.preprocessed_data_buffer_duration_s = 0.5;
        
        auto container = std::make_unique<ExposedContainer>(settings);
        auto hud = std::make_unique<gui::OpenCvHud>(10, 0, 1260, 400);
        
        // Initialize MJPEG Streamer
        nadjieb::MJPEGStreamer streamer;
        streamer.start(8080);
        std::cout << "MJPEG Streamer started on http://localhost:8080/video_feed\n";

        auto status = container->SetOnCoreMetricsOutput(
            [&hud, &session_manager, &pulse_smoother, &breathing_smoother](const presage::physiology::MetricsBuffer& metrics, int64_t timestamp) {
                bool has_data = !metrics.pulse().rate().empty() && !metrics.breathing().rate().empty();
                
                // Get Raw Values
                float raw_pulse = 0;
                float raw_breathing = 0;
                if (!metrics.pulse().rate().empty()) raw_pulse = metrics.pulse().rate().rbegin()->value();
                if (!metrics.breathing().rate().empty()) raw_breathing = metrics.breathing().rate().rbegin()->value();

                // Apply Smoothing
                float smoothed_pulse = pulse_smoother.Update(raw_pulse);
                float smoothed_breathing = breathing_smoother.Update(raw_breathing);

                // Auto-session management removed for manual 'a' key control
                if (session_manager.is_recording) {
                    session_manager.ProcessMetrics(metrics);
                }
                
                // Real-time terminal output - Now on a new line
                if (has_data) {
                    std::cout << "Vitals (S) - Pulse: " << std::fixed << std::setprecision(1) << smoothed_pulse 
                              << " BPM, Breathing: " << smoothed_breathing << " BPM (Recording: " 
                              << (session_manager.is_recording ? "ON" : "OFF") << ")\r" << std::flush; // Use \r to reduce spam
                }

                hud->UpdateWithNewMetrics(metrics);
                
                // Export real-time SMOOTHED vitals to JSON for frontend
                std::ofstream vitals_file("../vitals.tmp");
                if (vitals_file.is_open()) {
                    vitals_file << "{\n"
                                << "  \"pulse\": " << std::fixed << std::setprecision(1) << smoothed_pulse << ",\n"
                                << "  \"breathing\": " << smoothed_breathing << ",\n"
                                << "  \"recording\": " << (session_manager.is_recording ? "true" : "false") << "\n"
                                << "}\n";
                    vitals_file.close();
                    std::filesystem::rename("../vitals.tmp", "../latest_vitals.json");
                }

                return absl::OkStatus();
            }
        ); 
        
        // Create raw pointer for lambda capture
        auto* raw_container = container.get();

        status = container->SetOnVideoOutput(
            [&hud, &session_manager, &streamer, raw_container](cv::Mat& frame, int64_t timestamp) {
                // HUD disabled for raw feed
                // hud->Render(frame).IgnoreError();
                
                // Overlay recording status
                if (session_manager.is_recording) {
                    cv::circle(frame, cv::Point(50, 50), 10, cv::Scalar(0, 0, 255), -1);
                    cv::putText(frame, "REC Q" + std::to_string(session_manager.question_counter), 
                                cv::Point(70, 60), cv::FONT_HERSHEY_SIMPLEX, 0.8, cv::Scalar(0, 0, 255), 2);
                }

                // Stream frame
                std::vector<uchar> buff_bgr;
                cv::imencode(".jpg", frame, buff_bgr);
                std::string content(buff_bgr.begin(), buff_bgr.end());
                streamer.publish("/video_feed", content);

                // Remote Trigger Check (Enhanced with Commands)
                if (std::filesystem::exists("../vitals_trigger.tmp")) {
                    std::ifstream trigger_in("../vitals_trigger.tmp");
                    std::string command;
                    if (trigger_in.is_open()) {
                        std::getline(trigger_in, command);
                        trigger_in.close();
                    }
                    
                    std::cout << "Trigger Recvd: [" << command << "] "; // Debug

                    if (command == "STOP") {
                        if (session_manager.is_recording) {
                            std::cout << "Stopping Session for Q" << session_manager.question_counter << "\n";
                            session_manager.EndSession(); 
                        } else {
                            std::cout << "Ignored STOP (Not recording)\n";
                        }
                    } 
                    else if (command == "NEXT") {
                        if (session_manager.is_recording) {
                            std::cout << "Ending Q" << session_manager.question_counter << " -> Starting Q" << (session_manager.question_counter + 1) << "\n";
                            session_manager.EndSession(); 
                            session_manager.StartSession();
                        } else {
                            std::cout << "Ignored NEXT (Not recording, treating as START)\n";
                            session_manager.StartSession();
                            raw_container->SetRecordingPublic(true);
                        }
                    }
                    else { // Default "START" or empty
                        if (!session_manager.is_recording) {
                            std::cout << "Starting new session Q" << session_manager.question_counter << "\n";
                            session_manager.StartSession();
                            raw_container->SetRecordingPublic(true);
                        } else {
                            std::cout << "Ignored START (Already recording)\n";
                        }
                    }
                    
                    std::filesystem::remove("../vitals_trigger.tmp");
                }

                return absl::OkStatus();
            }
        ); 
        
        if (auto status = container->Initialize(); !status.ok()) {
            std::cerr << "Failed to initialize: " << status.message() << "\n";
            return 1;
        }
        
        std::cout << "Ready! Waiting for Frontend Triggers (START, NEXT, STOP) or press 'q' to quit.\n";
        container->Run().IgnoreError();
        
        cv::destroyAllWindows();
        return 0;
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }
}
