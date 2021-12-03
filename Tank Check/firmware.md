# TankCheck LoRa Sensor Firmware
-----

## BLE OTA
Over the air updates can be performed over BLE using the nRFConnect app. Only Android has been tested.

To start an update, launch nRFConnect and scan for the device.  The Tankcheck devices currently do not send a BLE name, so they will appear as "N/A" in the scan list.  Once connected you will see a small "DFU" icon in the top right corner of the app.  Click on the DFU button and then select the firmware that will be in the format "TankCheck_v0.0.8.dfu.zip". 

If there are any errors during the update, check the log in nRFConnect for specific error messages.
 
-----
## BLE/Lora Parameters
All parameters detailed below will be sent with the BLE characteristic UUID: ```6ff6xxxx-1392-4a00-93d7-551c884c2ec7``` where ```xxxx``` is replaced by the variable ID. Over LORA, only the least significant 12-bits of the ID are used, so in all cases these parameter IDs will be limited to 12-bits so they can be accessed over BLE and LoRa.  Further, the convention for all parameters is to use bits 8-11 as a category for organizing variables into separate logical groups

**TIP:** If using nRFConnect to debug and tweak parameters, you can tap and hold on an "Unknown Characteristic" and can then assign a user defined name to the characteristic (per the info below), which can greatly help usability.

### TankCheck Readings (Group = 0)
BLE service UUID = ```0000fee5-0000-1000-8000-00805f9b34fb```

Note: All variables in this service are transmitted over LoRa.
#### firmware_version  - 0x0001
- **Description:** Firmware version. It shall conform to the format (0-5).(0-99).(0-99) to fit in u16.  So firmware "1.2.34" is the same as 10234.  When this is "written", it will start/trigger a LORA OTA update for the specified version number that was written.
- **Type:** uint16_t
- **Scaling:** N/A
- **Valid Range:** N/A
- **Default:** N/A
- **Permission:** Read/Write 

#### bootloader_version  - 0x0006
- **Description:** Bootloader version. A single incrementing uint16_t version number for the current installed bootloader.  When this is "written", it will start/trigger a LORA OTA update for the specified version number that was written except a 0x8000 is appended.  Therefore the bootloader update over LORA should send the desired bootloader but append 0x8000 to the reported version as well.  This is to allow a distinction between normal and bootloader updates.
- **Type:** uint16_t
- **Scaling:** N/A
- **Valid Range:** N/A
- **Default:** N/A
- **Permission:** Read/Write 


#### top_level_pn - 0x0003
- **Description:** Top level part number and version
- **Type:** string
- **Scaling:** N/A
- **Valid Range:** N/A
- **Default:** N/A
- **Permission:** Read-only

#### serial_number - 0x0005
- **Description:** Serial number of the device - top_level_pn + serial_number is what shall be on the label
- **Type:** uint32_t
- **Scaling:** N/A
- **Valid Range:** N/A
- **Default:** N/A
- **Permission:** Read-only

#### pcba_pn - 0x0004
- **Description:** PCB assembly part number and version
- **Type:** string
- **Scaling:** N/A
- **Valid Range:** N/A
- **Default:** N/A
- **Permission:** Read-only

#### raw_level - 0x004E
- **Description:** The raw level (time of flight) of the ultrasound readings
- **Type:** uint16_t
- **Scaling:** us
- **Valid Range:** 0 to 10000us
- **Default:** 0us
- **Permission:** Read-only

#### quality - 0x0051
- **Description:** Arbitrary metric for quality of the ultrasonic reading 
- **Type:** uint16_t
- **Scaling:** None
- **Valid Range:** 0 to 65535
- **Default:** 0
- **Permission:** Read-only

#### battery - 0x0042
- **Description:** Arbitrary metric for quality of the ultrasonic reading 
- **Type:** uint8_t
- **Scaling:** raw / 64 [volts]
- **Valid Range:** 0 to 3.6V
- **Default:** 3.0V
- **Permission:** Read-only

#### tank_temperature - 0x0054
- **Description:** Temperature of tank
- **Type:** uint8_t
- **Scaling:** raw / 2 - 40 [degC]
- **Valid Range:** -40 to 85C
- **Default:** 25C
- **Permission:** Read-only

#### acceloXY - 0x0002
- **Description:** Accelerometer X and Y readings.  Sent as 4 total bytes, but actually an array of 2 int16_t.  
- **Type:** int16_t[2]
- **Scaling:** X = raw[0] / 16384 G.  Y = raw[1] / 16384 G
- **Valid Range:** -2G to 2G for both X and Y
- **Default:** 0G (gravities)
- **Permission:** Read-only

#### flags - 0x0007
- **Description:** System state bit flags
- **Type:** uint8_t
- **Scaling:** 
     Bit 0 = state of SYNC button 
     Bit 1 = hyper mode active (hyper_count != 0)
     Bit 2-7 = reserved
- **Valid Range:** 0-255
- **Default:** 0
- **Permission:** Read-only

#### peaks_short - 0x0080
- **Description:** A compressed version of the graph that is generated from the derivative with some filtering to sum multiple consecutive rising points and to ignore spikes that are too low.  Also uses a delta timestamp to provide more resolution.

This is only available over LORA.  It is sent as a variable length string consisting of an array of 2-byte structures.  The first byte in the structure is a 5us timestamp relative to the previous time + 1.  And the second byte is the amplitude of the peak.

Pseudo code to generate a plot:
```
int time = 0;
uint8_t plot[15000] = {0};				// fill all points with 0 - each index is 1us
for (int i = 0; i < rx_len; i += 2) {
	uint16_t time += 1 + (rx_buf[i]);	// units are 5us ticks
	uint8_t amplitude = rx_buf[i + 1];	// arbitrary amplitude units
	plot[time*5] = amplitude; 	
}
display_plot(plot);
```

---
### TankCheck Settings (Group 1)
BLE service UUID = ```6ff6fee6-1392-4a00-93d7-551c884c2ec7```

The variables in this service configure various settings for the ultrasound and tankcheck sensors.  They are currently not documented because they are likely to change and should not be modified.

#### pulse_strength - 0x0102
- **Description:**  
How hard to strike the piezo.  This is proportional to the energy driven into the piezo and is roughly 1:1 with the peak voltage seen on the piezo
- **Type:** uint8_t
- **Scaling:** None / Arbitrary
- **Valid Range:** 8 to 200
- **Default:** 200
- **Permission:** Read/Write

#### pulse_skip - 0x0107
- **Description:**  
Indicates how long to ignore pulses at the start of a sample waveform.  This helps to avoid the initial ringing that typically shows immediately 
after the piezo is striked.  It is possible to still detect levels below this range, but the algorithm will rely only on the scoring of successive echoes rather than the actual 
echo amplitude that happens in this range.
- **Type:** uint8_t
- **Scaling:** raw * 20 [us]
- **Valid Range:** 0us to 5100us
- **Default:** 9
- **Permission:** Read/Write

#### hyper_count - 0x0106
- **Description:**  
Indicates the number of samples that will run (or that are remaining) in hyper mode.  During hyper mode, the sampling is run at 350ms, 
so this parameter will allow you to specify a time for how long to be in hyper mode
- **Type:** uint16_t
- **Scaling:** hyper_rate ticks
- **Valid Range:** 0 to 65535
- **Default:** 0
- **Permission:** Read/Write

#### shelf_life_mode - 0x0108
Manually enter low-power "shelf-life" mode with battery life that should last decades.  Can be woken up by pressing the SYNC button 5 times, or holding it for 5 seconds.
Must write the value 0x02020202 to trigger.  Anything else has no effect.
- **Type:** uint32_t
- **Scaling:** None
- **Valid Range:** N/A
- **Default:** N/A
- **Permission:** Write-Only


---

### Reserved Service (Group 2)
BLE service UUID = ```6ff6fee7-1392-4a00-93d7-551c884c2ec7```  

Reserved for future use

---

### LoRa Settings (Group 3)
BLE service UUID = ```6ff6fee8-1392-4a00-93d7-551c884c2ec7```  

#### channel - 0x0301
- **Description:**  
The RF channel to use when initiating communication with the gateway. The actually frequency is ``903MHz + channel * 200kHz``.  Note that this is custom and does not match LoRaWAN
- **Type:** uint8_t
- **Scaling:** None
- **Valid Range:** 0 to 64
- **Default:** 0
- **Permission:** Read/Write

#### interval_min - 0x0302
- **Description:**  
The minimum or base time in minutes between each transmission attempt. The actual time in ms between attempts is :  
      ``time = lora_interval_min * 60000 + rand() % (lora_interval_rand * 60000) + (rand % 65536)``
- **Type:** uint16_t
- **Scaling:** minutes
- **Valid Range:** 1 to 65535
- **Default:** 55 minutes
- **Permission:** Read/Write


#### interval_dev - 0x0303
- **Description:**  
The random deviation time in minutes for each transmission attempt. The actual time in ms between attempts is :  
      ``time = lora_interval_min * 60000 + rand() % (lora_interval_rand * 60000) + (rand % 65536)``
- **Type:** uint16_t
- **Scaling:** minutes
- **Valid Range:** 1 to 65535
- **Default:** 10 minutes
- **Permission:** Read/Write

#### tx_power - 0x0304
- **Description:**  
 Transmit power in range +2dBm to +17dBm, or +20dBm.  To save battery life, this should be adjusted to the minimum that is needed to reach the gateway
- **Type:** uint8_t
- **Scaling:** dBm
- **Valid Range:** 2 to 17, or 20
- **Default:** 14
- **Permission:** Read/Write

#### last_rssi - 0x0305
- **Description:**  RSSI of last received packet
- **Type:** int16_t
- **Scaling:** dBm
- **Valid Range:** TBD
- **Default:** -32768 dBm (invalid)
- **Permission:** Read-only


#### last_snr - 0x0306
- **Description:**  Estimation of the signal-to-noise ratio for the last packet received. In two’s compliment format mutiplied by 4.
- **Type:** int8_t
- **Scaling:** raw / 4 [V/V]
- **Valid Range:** TBD
- **Default:** -32 V/V (invalid)
- **Permission:** Read-only
 
## Version History

### Version 0.0.49 - 10/01/19
- Changed so that LORA will be sent every 30s +/- 32.768s during hyper mode.  Also note, will reset any pending delay and start a new 30 +/- 32.768s delay upon entering hyper mode from being off.

### Version 0.0.48 - 09/23/19
- Fixed potential bug relating to int16_t versus uint16_t dealing with internal filtering if ever set above 32767.  Would cause the ultrasonic sampling/graphs to go haywire.  This had absolutely no effect because the default was only 2000 - this was discovered during EOL testing.  

### Version 0.0.47 - 09/22/19
- Added 'flags' parameter that reflects the button state as well as hyper mode state (e.g. same as hyper_count != 0).  This was to facilitate EOL but available for any other needs.  

### Version 0.0.44 to 0.0.46 - 09/10/19
- Internal changes to support EOL as well as FCC testing.  Added support for undocumented 'debug_cmd' BLE parameter.

### Version 0.0.43 - 09/02/19
#### Changes
- Changed so that when no accelerometer is present (or bad solder) it will return the max negative value (-32768) for both X and Y instead of 0.  This is to ensure the accelerometer is out of range and will fail when not operational.

### Version 0.0.41 - 08/27/19
#### Changes
- NOTE: Units that were built prior to this should not be updated past this point.  New values are placed by EOL and no backwards compatibility was specifically tested
- Added support for storing the part number and serial number internally.  And now explicitly set the hwid (version flag) in the BLE advertisement to 0x02 for BULK and 0x01 for Vertrax Standard sensors

### Version 0.0.40 - 08/25/19
#### Changes
- Added 'bootloader_version' BLE parameter
- Other internal changes to cleanup debug messages and prep for radio test mode for EOL

### Version 0.0.28 and Bootloader V3
#### Changes
- ***MUST UPDATE TO V3 OF BOOTLOADER AND THEN V0.0.28 of firmware in that order.  Then can do BLE and LORA updates as normal
- Added support in bootloader to read the saved firmware from SPI flash and write it to the MCU using the exact DFU protocol that BLE uses.  Also modified the app to perform some sanity checks before jumping to the bootloader to finalized the update.
- Added a variable to send a "compressed" version of the graph.  It is basically the derivative of the original graph to reduce data and so I can only send the quick spike (summed for all rising portions) as a single point.  I send up to 56 of these spikes in one (and only) LORA packet.  Used a delta-t for the timestamp to store more resolution and lower absolute since they are strictly increasing.

### Version 0.0.27 - 08/12/19
#### Changes
- Added support for writing SPI flash from LORA (still need to add bootloader support to finish OTA)
- Changed tc struct to not be in flash - saved 5K flash
- Modified SPI driver to be bare-on-metal - saved 800 bytes flash.  To better support common code in upcoming bootloader change

### Version 0.0.26 - 08/07/19
#### Changes
- Modified so that the firmware version characteristic is 16 bits.  
- Modified so the firmware version can be "written".  This will trigger the LORA OTA update
- Changed LORA rx timeout from 3 to 1.5 seconds
- Modified so firmware request will request 4 packets be returned every 3 seconds
- Fixed so that the 'after' flag respects 0-250 as a value instead of 6-132
- Fixed LORA interrupts being missed.  They were actually only triggering after each sample period (350ms or 3.5 seconds depending on hyper mode).


### Version 0.0.25 - 7/26/19
#### Changes
- Added support for setting all writable characteristics via custom LORA command (SET_VALUES).
- Added support for receiving the LORA "after" parameter.  The device will send a response packet 500-1000ms (random interval) on the channel specificed by "after".  The next packet will be either the normal broadcast parameters, or else the requested parameters if received by a REQ_VALUES command.  
- Added support for received parameter requests via the LORA command REQ_VALUES.  If the request list is received with the "after" flag, the response will be sent immediately after (500-1000ms). Otherwise will be sent on next normal update *instead* of the usual values - we can change this if needed.  Note: Not fully tested because no g/w support yet
- Added initial non-finished code for REQ_FW command.  No way to actually have the f/w auto start the process though so only tested manually. Note: Not fully tested because no g/w support yet
- Added serial number characteristic (0x0005).  


### Version 0.0.24 - 7/21/19
#### Changes
- Added support for "manufacturing" mode or "shelf-life" mode.  This is a low power off mode that the device will ship from the factory similar to our previous generation sensors.  Press the SYNC button 5 times or else hold for 5 seconds, and it will wake up permanently.   After any press, the sensor will stay awake for 60 seconds listening for the button wake sequences.  During this time everything is operational except the advertisement uses manufacturer ID 0x0060 instead of 0x0059.  Current consumption is approximately 600-800nA when asleep.  
- Added support for manually invoking "shelf-life" mode via characteristic uuid 0x0108.  You must write the magic value 0x02020202 to enter.  This is slighly different from
how the devices ship in that any hard power cycle will also cause the sensor to exit shelf-life mode - in contrast, only the button press sequences can wake it up from the factory
- New "version 2" bootloader to prevent conflicts with shelf-life "OFF" mode to prevent bootloader from being prevented when waking up from shelf life mode
- Slowed down RC clock calibration rate to improve battery life very slightly
- Added support for R/W auth characteristics with bounds/range checks.  And added upper bounds to the pulse_power parameter to prevent overdriving our circuitry

#### Known Issues
- Original bootloader shipped on about 30 units will not work properly with the manually invoked shelf-life mode.  The problem is that when you try to wake it up, the bootloader will be invoked because it is coming from POWER OFF with a button press, which is normally a manual way to get into the bootloader.  The workaround is to remove power.  It may also be possible to wait for the bootloader delay to finish and then during the 60 second awake window, press the SYNC button to awake it permanently.  Bootloader should be updatable although I have not tested yet.  


### Version 0.0.22 - 7/17/19
#### Changes
- Added support for putting the SPI NOR flash is low power mode to keep idle current low to preserve battery
- Added pulse_skip setting to ignore the first N samples of the wave form.  Defaults to 9 (180us) and used to be hard coded 3 (60us).  Useful to avoid some of the noise/ringing immediately after piezo strike, e.g. for large tanks where a few inches doesn't matter anyway.

### Version 0.0.20 - 7/6/19
#### Changes
- Added top-level and PCBA characteristics
- Updated accelerometer to use stack for reading (saves ~190 bytes of RAM). 
- Grew stack by 512 bytes.  
- Added ability to write pcba part number to user flash on bootup and then load from there to prevent a case where device comes up differently on boot.  Also should allow factory settings to save need for boot pins.  
- Some other RAM savings
- Added RAM functions and RAM_FUNC macro to place functions in RAM - should see speedup and battery savings.
- Change to retry accelo 3 times before giving up

### Version 0.0.17 - 6/30/19
#### Changes
- Added hyper_count parameter to manually set how long to be in hyper mode
- Changed default connection intervals to be slower with longer slave latency

### Version 0.0.15 - 6/28/19
#### Changes
- Modified BLE advertisement to better support new features.  Supported by app v2.1.40+.

### Version 0.0.14 - 5/30/19
#### Changes
- Modified algorithm to be much improved - specifically tweaked timing of pulses and capturing of the edges.  Also quality is much more stable and fixed various issues here when using aggressive power and gain settings
- Modified level to be sent in us instead of 20us ticks.  This is a result of the improvements to the algorithm where we can actually make out better resolution
- Changed pulse_param to 50
- Fixed potential minor timing issue (ms timer could lose some ticks)

### Version 0.0.12 - 5/29/19

#### Changes
- Changes to the core filtering and algorithm to be much more robust to various settings for gain, power, etc.  Changes break legacy app even more.  Also quality will be completely different now for any settings besides the old.
- Changed pulse_param to default to 40 - was 16.
- Fixed an issue with quality saturating to 16-bits when signal too good.  This could also cause bad level
- Changed to use interrupts only - no scheduler.  This should fix a very unlikely race condition over the SPI port between accelo and lora as well
- Added stack guard and other extra checks for "HardFaults"

### Version 0.0.11 - 5/24/19
- Fixed issue with pulse_param not being linear

### Version 0.0.10 - 05/10/19 

#### Changes
- Fixed bug in Lora transmit.  Caused by using variable on the stack that was not being copied in the SPI driver.
- Added battery measurement into legacy packet (so app can read battery now)

#### Known Issues
- ~~Temperature is not being sent in legacy packet (reports not available so no temp comp will happen in app)

### Version 0.0.9 - 05/07/19 

#### Changes
- Changed LORA packet to send 4 byte MAC address.  And removed the "to" address.
- Low power considerations.  Fixed ADC and accelo sleep.  Created battery estimation spreadsheet.  Looks like average current with no LoRa is down to about 20us under 3.5s advert and sampling
- Added hyper mode after button press. 212ms broadcast. 30 minutes.  Then returns to standard 3.5s broadcast
- Changed BLE parameters to be more friendly on power consumption during connection.  Uses about 30uA average (BLE connection and 3.5s sampling only)
- Changed to use 4dBm for BLE tx power (instead of default 0dBm)
- Changed Lora processing logic to come always after a ultrasonic sample event instead of from a timer.  This is to prevent the possibility of Lora sending at same time as pulse or other activity.
- Added support for reading accelerometer and actively turning off between samples to reduce power and then does fast average of ~30 points.  Sending in legacy accelerometer packet.  Also as characteristic
- Added firmware version characteristic
- Optimize for speed on core algorithm functions
- Lora transition from sleep -> standby polls status bit instead of blindly waiting 1ms for transition
- Removed "presentation format" on some BLE characteristics (U8 and string types) to save memory. These will all likely be removed eventually

#### Known Issues
- Sampling needs to be timed to come shortly before advertisement to reduce latency slightly and guarantee no BLE during sampling. 
- Sampling timing needs to be slightly randomized
- ~~Want to get rid of scheduler and use interrupts only
- No BLE notification support for raw level - do we need this though?
- ~~Battery voltage is not being sent in legacy packet (still reports 3.5V max)~~

### Version 0.0.8 - 04/29/19 

#### Changes
 - Added support for Lora radio, sending tankcheck parameters, and receiving responses from gateway (not yet parsed).   
 - Added RSSI and SNR for received Lora packets
 - Added multiple parameters to configure Lora settings: channel, interval_min, interval_dev, tx_power. 
 - Press the push button to manually send one Lora packet.  Otherwise the default transmission rate is 1 hour +/- 5 minutes and can be changed over BLE
 - Optimization such that 2-byte values are sent as 1-byte if the MSB is 0.
 - Removed BLE characteristic descriptions (the friendly name) to save RAM.  Also because nRFConnect now has a very handy feature where you can assign user defined names to UUIDs locally on the phone.
 
#### Known Issues
 - ~~A blue-wire mod is required for Lora to properly receive a packet (DIO0 interrupt)
 - ~~There is no hyper mode.~~
 - ~~Idle/Sleep battery consumption is high and has not been debugged yet.~~
 - ~~Ultrasound is sampled at 3.5 seconds.  And BLE transmissions are sent at a fixed 300ms interval (causing extra battery)~~
 - ~~There is no accelerometer support~~
 - Lora packets are received but nothing is being done with the data yet. The plan is for the "SET" command to assign any variable in the same way BLE can.
 - LoRa Transmit power is defaulted to 14dBm even though 20 dBm is module max.  When using a lower battery I could observe resets during transmission due to a series 10 ohm resistor used to limit current for hazardous environment testing.  More research will need to be done on how to best handle this scenario.  If resets occur, lower your transmit power.  A reset can be distinguished if the RSSI of last packet is not set (within the first hour a packet will go out and will update this).   
 - Parameters are not retained in flash memory, so after a reset or power cycle, all parameters will be back to their factory default values.
 - If you change the Lora update interval, it will not take effect until after the next transmission.  Press the push button to send a packet and force the update.
 

### Version 0.0.6 - 04/07/19
### Changes
 - Initial release
#### Known Issues
 - ~~Lots~~
 - ~~Emulates classic Tankcheck packet but in low level or high noise scenario the reading sent may not be accurate.  This is because the old sensor could only capture 12 echos, but on new sensor we can easily catch more based on the current settings (e.g. from more noise initially, longer sampling, etc.)  In all cases, the BLE GATT parameter will still be accurate though.
 - Not much optimization on thresholds for "empty".  So a sensor not on a tank may read a non-empty value.  But it should also have a low Q that can be used to distinguish this.  Need to add a setting to ignore Q below X - especially for app
 - ~~Algorithm only configured for the ultrasound "default" settings.  E.g. readings likely won't work properly if you tweak any of the configurable BLE power such as pulse strength, gain settings, etc. 
 - ~~the LPG level is 'rawLevel' and is simply the time of flight.  No speed of sound or temp correction is performed
 
 
 ### Confidentiality Notice / License
 Mopeka Products, LLC ("COMPANY") CONFIDENTIAL
 Unpublished Copyright (c) 2015-2019 Mopeka Products, LLC, All Rights Reserved.
 
 NOTICE: All information contained herein is, and remains the property of COMPANY. The intellectual and technical concepts contained
 herein are proprietary to COMPANY and may be covered by U.S. and Foreign Patents, patents in process, and are protected by trade secret or copyright law.
 Dissemination of this information or reproduction of this material is strictly forbidden unless prior written permission is obtained
 from COMPANY. Access to the file and information contained herein is hereby forbidden to anyone except current COMPANY employees, managers or contractors who have executed
 Confidentiality and Non-disclosure agreements explicitly covering such access.
 
 The copyright notice above does not evidence any actual or intended publication or disclosure of this information, which includes
 information that is confidential and/or proprietary, and is a trade secret, of COMPANY.  ANY REPRODUCTION, MODIFICATION, DISTRIBUTION, PUBLIC PERFORMANCE,
 OR PUBLIC DISPLAY OF OR THROUGH USE OF THIS INFORMATION WITHOUT THE EXPRESS WRITTEN CONSENT OF COMPANY IS STRICTLY PROHIBITED, AND IN VIOLATION OF APPLICABLE
 LAWS AND INTERNATIONAL TREATIES. THE RECEIPT OR POSSESSION OF THIS FILE AND/OR RELATED INFORMATION DOES NOT CONVEY OR IMPLY ANY RIGHTS
 TO REPRODUCE, DISCLOSE OR DISTRIBUTE ITS CONTENTS, OR TO MANUFACTURE, USE, OR SELL ANYTHING THAT IT MAY DESCRIBE, IN WHOLE OR IN PART.
