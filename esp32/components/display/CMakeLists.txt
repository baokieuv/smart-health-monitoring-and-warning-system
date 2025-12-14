idf_component_register(
    SRCS "oled_display.c"                   
    INCLUDE_DIRS "."
    REQUIRES
        driver
        u8g2
        esp_timer
        common
)