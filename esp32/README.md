#### Add dependencies

```bash
cd esp32
idf.py add-dependency "espressif/onewire_bus^1.0.4"
idf.py add-dependency "espressif/ds18b20^0.2.0"
idf.py add-dependency "espressif/mpu6050^1.2.0"
```

#### Build và Flash lên ESP32

```bash
idf.py set-target esp32
idf.py build
idf.py -p <COM port> flash monitor
# idf.py -p COM10 flash monitor

```
