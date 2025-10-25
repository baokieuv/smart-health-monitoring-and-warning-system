#include "max30102_api.h"

void max30102_init(i2c_port_t i2c_num, max_config *configuration)
{
	ESP_LOGI("MAX30102_INIT", "Starting sensor configuration...");

    // Thêm Reset cảm biến (Rất quan trọng!)
    if (write_max30102_reg(i2c_num, 0x40, REG_MODE_CONFIG) != ESP_OK) {
        ESP_LOGE("MAX30102_INIT", "Failed to reset sensor!");
        return;
    }

    vTaskDelay(pdMS_TO_TICKS(100)); // Chờ reset
	if (write_max30102_reg(i2c_num, configuration->data1, REG_INTR_ENABLE_1) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data2, REG_INTR_ENABLE_2) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data3, REG_FIFO_WR_PTR) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data4, REG_OVF_COUNTER) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data5, REG_FIFO_RD_PTR) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data6, REG_FIFO_CONFIG) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data7, REG_MODE_CONFIG) != ESP_OK) return; // Kích hoạt chế độ
	if (write_max30102_reg(i2c_num, configuration->data8, REG_SPO2_CONFIG) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data9, REG_LED1_PA) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data10, REG_LED2_PA) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data11, REG_PILOT_PA) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data12, REG_MULTI_LED_CTRL1) != ESP_OK) return;
	if (write_max30102_reg(i2c_num, configuration->data13, REG_MULTI_LED_CTRL2) != ESP_OK) return;

	ESP_LOGI("MAX30102_INIT", "Sensor configuration OK.");
}


void read_max30102_fifo(i2c_port_t i2c_num, int32_t *red_data, int32_t *ir_data)
{
	uint8_t un_temp[6];
	uint8_t fifo_reg = REG_FIFO_DATA;

    i2c_sensor_write(i2c_num, &fifo_reg, 1);

    i2c_sensor_read(i2c_num, un_temp, 6);
    //  *red_data += un_temp[0] << 16;
    //  *red_data += un_temp[1] << 8;
    //  *red_data += un_temp[2];

    //  *ir_data += un_temp[3] << 16;
    //  *ir_data += un_temp[4] << 8;
    //  *ir_data += un_temp[5];
	*red_data = (int32_t)((un_temp[0] & 0x03) << 16) | (un_temp[1] << 8) | un_temp[2];
    *ir_data  = (int32_t)((un_temp[3] & 0x03) << 16) | (un_temp[4] << 8) | un_temp[5];
}


void read_max30102_reg(i2c_port_t i2c_num, uint8_t reg_addr, uint8_t *data_reg, size_t bytes_to_read)
{
	i2c_sensor_write(i2c_num, &reg_addr, 1);
	i2c_sensor_read(i2c_num, data_reg, bytes_to_read);
}


esp_err_t write_max30102_reg(i2c_port_t i2c_num, uint8_t command, uint8_t reg)
{
	uint8_t data[2];
	data[0] = reg;
	data[1] = command;
	return i2c_sensor_write(i2c_num, data, 2);
}


float get_max30102_temp(i2c_port_t i2c_num)
{
	uint8_t int_temp;
	uint8_t decimal_temp;
	uint8_t temp_status = 0;
	float temp = 0;
	write_max30102_reg(i2c_num, 1, REG_TEMP_CONFIG);
	while (!(temp_status & 0x02)) {
		read_max30102_reg(i2c_num, REG_INTR_STATUS_2, &temp_status, 1);
		vTaskDelay(pdMS_TO_TICKS(1)); // Không spam bus I2C
	}
	read_max30102_reg(i2c_num, REG_TEMP_INTR, &int_temp, 1);
	read_max30102_reg(i2c_num, REG_TEMP_FRAC, &decimal_temp, 1);
	temp = (int_temp + ((float)decimal_temp/10));
	ESP_LOGI("MAX30102", "get max30102 temp done!");
	return temp;
}


