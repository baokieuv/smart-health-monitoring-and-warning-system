#ifndef I2C_API_H
#define I2C_API_H

#include "esp_err.h"
#include "driver/i2c.h"

#define MAX30102_ADDR 0x57

#define ACK_CHECK_EN 0x1
#define I2C_MASTER_RX_BUF_DISABLE 0
#define I2C_MASTER_TX_BUF_DISABLE 0
#define ACK_VAL 0x0
#define NACK_VAL 0x1

esp_err_t i2c_init(i2c_port_t i2c_num, int scl_pin, int sda_pin);
esp_err_t i2c_sensor_read(i2c_port_t i2c_num, uint8_t *data_rd, size_t size);
esp_err_t i2c_sensor_write(i2c_port_t i2c_num, uint8_t *data_wr, size_t size);



#endif
