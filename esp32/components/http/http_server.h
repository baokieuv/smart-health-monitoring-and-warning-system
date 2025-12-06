#ifndef HTTP_SERVER_H
#define HTTP_SERVER_H

#include "esp_err.h"
#include "config.h"


/**
 * @brief Start HTTP configuration server
 */
esp_err_t
http_server_start(system_mode_t sys_mode);

/**
 * @brief Stop HTTP configuration server
 */
esp_err_t http_server_stop(void);

/**
 * @brief Check if HTTP server is running
 */
uint8_t http_server_is_running(void);

#endif // HTTP_SERVER_H