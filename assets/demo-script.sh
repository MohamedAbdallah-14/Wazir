#!/bin/bash
# Demo commands for terminal recording
# This script is called by record-demo.sh via asciinema

echo "$ wazir doctor"
npx wazir doctor
sleep 2

echo ""
echo "$ wazir export build"
npx wazir export build
sleep 2

echo ""
echo "$ wazir index build"
npx wazir index build
sleep 1
