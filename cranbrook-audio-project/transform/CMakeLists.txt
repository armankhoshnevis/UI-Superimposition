#[[
 * CMake file for the SAF binaural wrapper library.
 * File created by asterisk727 on 2026-05-13.
#]]

cmake_minimum_required(VERSION 3.16)
project(saf_binaural_wrapper C)

set(CMAKE_POSITION_INDEPENDENT_CODE ON)

set(SAF_URL "https://github.com/leomccormack/Spatial_Audio_Framework/archive/refs/tags/v1.3.4.tar.gz" CACHE STRING "SAF source tarball URL")
set(SAF_TARGET "saf" CACHE STRING "SAF CMake target name")
set(SAF_INCLUDE_DIR "" CACHE PATH "SAF include directory")
set(SAF_EXAMPLES_INCLUDE_DIR "" CACHE PATH "SAF examples include directory")
set(SAF_FRAME_SIZE "128" CACHE STRING "Binauraliser frame size")

if(NOT DEFINED SAF_PERFORMANCE_LIB)
    set(SAF_PERFORMANCE_LIB "SAF_USE_OPEN_BLAS_AND_LAPACKE" CACHE STRING "SAF performance library")
endif()

set(SAF_BUILD_EXAMPLES ON CACHE BOOL "Build SAF examples" FORCE)
set(SAF_BUILD_TESTS OFF CACHE BOOL "Build SAF tests" FORCE)
set(SAF_BUILD_EXTRAS OFF CACHE BOOL "Build SAF extras" FORCE)
set(SAF_ENABLE_SOFA_READER_MODULE ON CACHE BOOL "Enable SAF SOFA reader" FORCE)

add_library(saf_binaural SHARED saf_binaural.c)

if(SAF_PERFORMANCE_LIB STREQUAL "SAF_USE_OPEN_BLAS_AND_LAPACKE")
    find_library(OPENBLAS_LIBRARY NAMES openblas)
    find_library(LAPACKE_LIBRARY NAMES lapacke)
    if(NOT OPENBLAS_LIBRARY OR NOT LAPACKE_LIBRARY)
        message(FATAL_ERROR "OpenBLAS and LAPACKE must be installed and discoverable. Install libopenblas and liblapacke (or set CMAKE_PREFIX_PATH / LD_LIBRARY_PATH).")
    endif()
endif()

include(FetchContent)
FetchContent_Declare(
    saf_src
    URL ${SAF_URL}
)
FetchContent_GetProperties(saf_src)
if(NOT saf_src_POPULATED)
    FetchContent_Populate(saf_src)
endif()
set(SAF_DIR "${saf_src_SOURCE_DIR}")
add_subdirectory("${saf_src_SOURCE_DIR}" "${saf_src_BINARY_DIR}")

if(SAF_DIR AND (SAF_INCLUDE_DIR STREQUAL ""))
    set(SAF_INCLUDE_DIR "${SAF_DIR}/framework/include" CACHE PATH "SAF include directory" FORCE)
endif()
if(SAF_DIR AND (SAF_EXAMPLES_INCLUDE_DIR STREQUAL ""))
    set(SAF_EXAMPLES_INCLUDE_DIR "${SAF_DIR}/examples/include" CACHE PATH "SAF examples include directory" FORCE)
endif()

if (SAF_DIR AND EXISTS "${SAF_DIR}/CMakeLists.txt")
    add_compile_definitions(FRAME_SIZE=${SAF_FRAME_SIZE})
    target_link_libraries(saf_binaural PRIVATE ${SAF_TARGET} saf_example_binauraliser)
    target_include_directories(saf_binaural PRIVATE "${SAF_INCLUDE_DIR}" "${SAF_EXAMPLES_INCLUDE_DIR}")

    if(SAF_PERFORMANCE_LIB STREQUAL "SAF_USE_OPEN_BLAS_AND_LAPACKE")
        target_link_libraries(saf_binaural PRIVATE ${OPENBLAS_LIBRARY} ${LAPACKE_LIBRARY})
    endif()
endif()

set_target_properties(saf_binaural PROPERTIES OUTPUT_NAME "saf_binaural")
