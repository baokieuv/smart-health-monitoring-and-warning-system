#ifndef HTTP_SERVER_H
#define HTTP_SERVER_H

#include "esp_err.h"

typedef enum
{
    HTTP_VIEW_USER,
    HTTP_VIEW_DOCTOR
} http_view_mode_t;

/**
 * @brief Start HTTP configuration server
 */
esp_err_t
http_server_start(void);

/**
 * @brief Stop HTTP configuration server
 */
esp_err_t http_server_stop(void);

/**
 * @brief Check if HTTP server is running
 */
uint8_t http_server_is_running(void);

void http_server_toggle_view_mode(void);

#endif // HTTP_SERVER_H