#!/bin/bash

CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}')
MEMORY=$(free | grep Mem | awk '{print ($3/$2)*100}')
DISK=$(df / | tail -1 | awk '{print $5}' | tr -d '%')

curl -X POST https://seu-hub.com/status/telerison__nome_do_servidor \
  -H "Content-Type: application/json" \
  -d "{\"cpu\":$CPU,\"memory\":$MEMORY,\"disk\":$DISK}" &>/dev/null
