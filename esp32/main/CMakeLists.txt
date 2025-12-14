idf_component_register(
    SRCS "main.c"
    INCLUDE_DIRS "."
    REQUIRES
        nvs_flash 
        driver 
        esp_event 
        esp_netif

        alarm
        common                                                                              
        display
        http
        mqtt_tb
        provisioning
        sensors
        storage
        sys_button
        wifi
)
