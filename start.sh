#!/usr/bin/env bash
# Produção via systemd. Reinicia o app (e o pg, se preciso).
sudo systemctl restart consultoria-plus
sleep 4
sudo systemctl is-active consultoria-pg consultoria-plus
