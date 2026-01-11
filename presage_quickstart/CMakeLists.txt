cmake_minimum_required(VERSION 3.27.0)
project(SmartSpectraHelloVitals CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(SmartSpectra REQUIRED)
find_package(OpenCV REQUIRED)

add_executable(hello_vitals hello_vitals.cpp)

target_link_libraries(hello_vitals
    SmartSpectra::Container
    SmartSpectra::Gui
    ${OpenCV_LIBS}
)