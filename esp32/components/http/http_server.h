#ifndef HTTP_SERVER_H
#define HTTP_SERVER_H

#include "esp_err.h"
#include "sytem_config.h"


/**
 * @brief Start HTTP server
 * @param mode System mode (simple or full configuration)
 * @return ESP_OK on success
 */
esp_err_t http_server_start(system_mode_t sys_mode);

/**
 * @brief Stop HTTP server
 * @return ESP_OK on success
 */
esp_err_t http_server_stop(void);

/**
 * @brief Check if HTTP server is running
 * @return true if running, false otherwise
 */
uint8_t http_server_is_running(void);

#endif // HTTP_SERVER_H