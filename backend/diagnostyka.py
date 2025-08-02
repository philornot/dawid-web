#!/usr/bin/env python3
"""
Uruchom mnie, jeśli coś z backendem nie działa.
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import subprocess
import requests
import json
import threading
import time
import re
from datetime import datetime
import socket
import os
import platform
from pathlib import Path


class DawidDiagnostics:
    def __init__(self, root):
        self.root = root
        self.root.title("Dawid AI - Diagnostyka Backend (Multi-IP)")
        self.root.geometry("900x700")

        # Ścieżka do pliku konfiguracji
        self.config_file = Path.home() / ".dawid_diagnostics_config.json"

        # Domyślna konfiguracja
        self.default_config = {
            "ip_addresses": ["192.168.1.144", "172.17.0.1", "100.113.203.25"],
            "port": 5000,
            "ssh_alias": "frpi",  # Twój alias SSH
            "ssh_user": "filip",
            "last_working_ip": None,
            "use_ssh_alias": True
        }

        # Załaduj konfigurację
        self.config = self.load_config()

        # Aktualnie używane IP
        self.current_working_ip = None

        # Sprawdź system operacyjny
        self.is_windows = platform.system() == "Windows"

        self.setup_gui()

    def load_config(self):
        """Załaduj konfigurację z pliku"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                # Merge z domyślną konfiguracją
                config = self.default_config.copy()
                config.update(loaded_config)
                return config
            except Exception as e:
                print(f"Błąd ładowania konfiguracji: {e}")

        return self.default_config.copy()

    def save_config(self):
        """Zapisz konfigurację do pliku"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Błąd zapisywania konfiguracji: {e}")

    def setup_gui(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Konfiguracja Multi-IP
        config_frame = ttk.LabelFrame(main_frame, text="Konfiguracja Multi-IP", padding="5")
        config_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))

        # IP Addresses
        ttk.Label(config_frame, text="Adresy IP (sprawdzane po kolei):").grid(row=0, column=0, sticky=tk.W,
                                                                              columnspan=4)

        self.ip_vars = []
        for i in range(4):
            ttk.Label(config_frame, text=f"IP {i + 1}:").grid(row=1 + i // 2, column=(i % 2) * 2, sticky=tk.W,
                                                              padx=(0, 5))
            var = tk.StringVar(value=self.config["ip_addresses"][i] if i < len(self.config["ip_addresses"]) else "")
            entry = ttk.Entry(config_frame, textvariable=var, width=15)
            entry.grid(row=1 + i // 2, column=(i % 2) * 2 + 1, padx=(0, 20), pady=2)
            self.ip_vars.append(var)

        # Port i SSH config
        ttk.Label(config_frame, text="Port:").grid(row=3, column=0, sticky=tk.W)
        self.port_var = tk.StringVar(value=str(self.config["port"]))
        ttk.Entry(config_frame, textvariable=self.port_var, width=8).grid(row=3, column=1, sticky=tk.W, padx=(0, 20))

        # SSH Configuration
        ssh_frame = ttk.LabelFrame(config_frame, text="SSH Config", padding="3")
        ssh_frame.grid(row=4, column=0, columnspan=4, sticky=(tk.W, tk.E), pady=(10, 0))

        self.use_alias_var = tk.BooleanVar(value=self.config["use_ssh_alias"])
        ttk.Checkbutton(ssh_frame, text="Użyj aliasu SSH", variable=self.use_alias_var,
                        command=self.toggle_ssh_mode).grid(row=0, column=0, sticky=tk.W)

        ttk.Label(ssh_frame, text="Alias:").grid(row=0, column=1, sticky=tk.W, padx=(20, 5))
        self.ssh_alias_var = tk.StringVar(value=self.config["ssh_alias"])
        self.alias_entry = ttk.Entry(ssh_frame, textvariable=self.ssh_alias_var, width=10)
        self.alias_entry.grid(row=0, column=2, padx=(0, 20))

        ttk.Label(ssh_frame, text="User@IP:").grid(row=0, column=3, sticky=tk.W, padx=(0, 5))
        self.ssh_user_var = tk.StringVar(value=self.config["ssh_user"])
        self.user_entry = ttk.Entry(ssh_frame, textvariable=self.ssh_user_var, width=10)
        self.user_entry.grid(row=0, column=4)

        self.toggle_ssh_mode()  # Ustaw początkowy stan

        # Przycisk zapisz config
        ttk.Button(config_frame, text="💾 Zapisz Konfigurację",
                   command=self.save_current_config).grid(row=5, column=0, columnspan=4, pady=(10, 0))

        # Status aktualnego IP
        self.current_ip_var = tk.StringVar(value="Brak aktywnego IP")
        ttk.Label(main_frame, textvariable=self.current_ip_var, font=('TkDefaultFont', 10, 'bold')).grid(
            row=1, column=0, columnspan=2, pady=(0, 10))

        # Przyciski diagnostyki
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))

        ttk.Button(buttons_frame, text="🔍 Pełna Diagnostyka",
                   command=self.run_full_diagnostics, style="Accent.TButton").pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(buttons_frame, text="🌐 Znajdź Działające IP",
                   command=self.find_working_ip).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(buttons_frame, text="📊 Stan Systemu",
                   command=self.check_system_status).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(buttons_frame, text="🔧 Test SSH",
                   command=self.test_ssh_connection).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(buttons_frame, text="🔄 Wyczyść",
                   command=self.clear_output).pack(side=tk.RIGHT)

        # Status bar
        self.status_var = tk.StringVar(value="Gotowy do diagnostyki")
        status_frame = ttk.Frame(main_frame)
        status_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))

        self.status_label = ttk.Label(status_frame, textvariable=self.status_var)
        self.status_label.pack(side=tk.LEFT)

        self.progress = ttk.Progressbar(status_frame, mode='indeterminate')
        self.progress.pack(side=tk.RIGHT, padx=(10, 0))

        # Wyniki
        results_frame = ttk.LabelFrame(main_frame, text="Wyniki Diagnostyki", padding="5")
        results_frame.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))

        self.output_text = scrolledtext.ScrolledText(results_frame, wrap=tk.WORD, width=90, height=25)
        self.output_text.pack(fill=tk.BOTH, expand=True)

        # Konfiguracja grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(4, weight=1)

        # Sprawdź ostatnie działające IP przy starcie
        if self.config["last_working_ip"]:
            self.current_working_ip = self.config["last_working_ip"]
            self.update_current_ip_display()

    def toggle_ssh_mode(self):
        """Przełącz między trybem aliasu a user@ip"""
        if self.use_alias_var.get():
            self.alias_entry.configure(state='normal')
            self.user_entry.configure(state='disabled')
        else:
            self.alias_entry.configure(state='disabled')
            self.user_entry.configure(state='normal')

    def save_current_config(self):
        """Zapisz aktualną konfigurację z GUI"""
        self.config["ip_addresses"] = [ip.get().strip() for ip in self.ip_vars if ip.get().strip()]
        self.config["port"] = int(self.port_var.get()) if self.port_var.get().isdigit() else 5000
        self.config["ssh_alias"] = self.ssh_alias_var.get()
        self.config["ssh_user"] = self.ssh_user_var.get()
        self.config["use_ssh_alias"] = self.use_alias_var.get()

        self.save_config()
        self.log("💾 Konfiguracja została zapisana", "SUCCESS")

    def update_current_ip_display(self):
        """Aktualizuj wyświetlanie aktualnego IP"""
        if self.current_working_ip:
            self.current_ip_var.set(f"🟢 Aktywne IP: {self.current_working_ip}")
        else:
            self.current_ip_var.set("🔴 Brak aktywnego IP")

    def get_active_ips(self):
        """Pobierz listę aktywnych IP z GUI"""
        return [ip.get().strip() for ip in self.ip_vars if ip.get().strip()]

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        color_map = {
            "INFO": "black",
            "SUCCESS": "green",
            "WARNING": "orange",
            "ERROR": "red",
            "ANALYSIS": "blue"
        }

        self.output_text.insert(tk.END, f"[{timestamp}] {message}\n")

        # Kolorowanie
        if level in color_map:
            start_line = self.output_text.index(tk.END + "-2l linestart")
            end_line = self.output_text.index(tk.END + "-1l lineend")
            self.output_text.tag_add(level, start_line, end_line)
            self.output_text.tag_config(level, foreground=color_map[level])

        self.output_text.see(tk.END)
        self.root.update()

    def set_status(self, message, progress=False):
        self.status_var.set(message)
        if progress:
            self.progress.start()
        else:
            self.progress.stop()
        self.root.update()

    def run_command_local(self, command):
        """Uruchom komendę lokalnie - obsługa Windows i Linux"""
        try:
            if self.is_windows:
                # W Windows używamy PowerShell
                result = subprocess.run(
                    ['powershell', '-Command', command],
                    capture_output=True, text=True, timeout=15,
                    encoding='utf-8', errors='replace'
                )
            else:
                # Linux/Mac
                result = subprocess.run(
                    command, shell=True, capture_output=True,
                    text=True, timeout=15
                )
            return result.stdout, result.stderr, result.returncode
        except subprocess.TimeoutExpired:
            return "", "Timeout - komenda trwała zbyt długo", 1
        except Exception as e:
            return "", str(e), 1

    def run_command_ssh(self, command, target_ip=None):
        """Uruchom komendę przez SSH - poprawiona wersja dla Windows"""
        if self.use_alias_var.get():
            # Użyj aliasu SSH
            ssh_target = self.ssh_alias_var.get()
        else:
            # Użyj user@ip
            ip = target_ip or self.current_working_ip
            if not ip:
                return "", "Brak dostępnego IP", 1
            ssh_target = f"{self.ssh_user_var.get()}@{ip}"

        # Escape'uj komendę dla Windows PowerShell
        escaped_command = command.replace("'", "''").replace('"', '`"')

        if self.is_windows:
            # Windows PowerShell - poprawne formatowanie
            ssh_command = f'ssh -o "ConnectTimeout=15" -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile=nul" -o "LogLevel=ERROR" {ssh_target} "{escaped_command}"'
        else:
            # Linux/Mac
            ssh_command = f"ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR {ssh_target} '{command}'"

        self.log(f"🔐 SSH: {ssh_target}", "INFO")
        return self.run_command_local(ssh_command)

    def find_working_ip(self):
        """Znajdź pierwsze działające IP"""
        self.set_status("Szukanie działającego IP...", True)
        threading.Thread(target=self._find_working_ip_thread, daemon=True).start()

    def _find_working_ip_thread(self):
        self.log("🔍 === SZUKANIE DZIAŁAJĄCEGO IP ===", "INFO")

        ips = self.get_active_ips()
        port = int(self.port_var.get())

        # Sprawdź ostatnie działające IP najpierw
        if self.config["last_working_ip"] and self.config["last_working_ip"] in ips:
            self.log(f"🎯 Sprawdzam ostatnie działające IP: {self.config['last_working_ip']}", "INFO")
            if self._test_single_ip(self.config["last_working_ip"], port):
                self.current_working_ip = self.config["last_working_ip"]
                self.update_current_ip_display()
                self.set_status("Znaleziono działające IP")
                return

        # Sprawdź pozostałe IP
        for ip in ips:
            if ip == self.config.get("last_working_ip"):
                continue  # Już sprawdzone

            self.log(f"🔍 Sprawdzam IP: {ip}", "INFO")
            if self._test_single_ip(ip, port):
                self.current_working_ip = ip
                self.config["last_working_ip"] = ip
                self.save_config()
                self.update_current_ip_display()
                self.log(f"✅ Znaleziono działające IP: {ip}", "SUCCESS")
                self.set_status("Znaleziono działające IP")
                return

        self.log("❌ Nie znaleziono żadnego działającego IP!", "ERROR")
        self.current_working_ip = None
        self.update_current_ip_display()
        self.set_status("Nie znaleziono działającego IP")

    def _test_single_ip(self, ip, port):
        """Test pojedynczego IP"""
        try:
            # Test 1: Ping - obsługa Windows i Linux
            if self.is_windows:
                ping_command = f"Test-NetConnection -ComputerName {ip} -Port {port} -InformationLevel Quiet"
                stdout, stderr, code = self.run_command_local(ping_command)
                if "True" not in stdout:
                    self.log(f"  ❌ {ip}: Port {port} closed", "ERROR")
                    return False
            else:
                stdout, stderr, code = self.run_command_local(f"ping -c 1 -W 3 {ip}")
                if code != 0:
                    self.log(f"  ❌ {ip}: Ping failed", "ERROR")
                    return False

            # Test 2: HTTP
            try:
                response = requests.get(f"http://{ip}:{port}/health", timeout=5)
                if response.status_code == 200:
                    self.log(f"  ✅ {ip}: Working!", "SUCCESS")
                    return True
                else:
                    self.log(f"  ❌ {ip}: HTTP {response.status_code}", "ERROR")
                    return False
            except:
                self.log(f"  ❌ {ip}: HTTP failed", "ERROR")
                return False

        except Exception as e:
            self.log(f"  ❌ {ip}: Error - {e}", "ERROR")
            return False

    def test_ssh_connection(self):
        """Test połączenia SSH"""
        self.set_status("Testowanie SSH...", True)
        threading.Thread(target=self._test_ssh_thread, daemon=True).start()

    def _test_ssh_thread(self):
        self.log("🔐 === TEST POŁĄCZENIA SSH ===", "INFO")

        if self.use_alias_var.get():
            self.log(f"🎯 Testuję alias SSH: {self.ssh_alias_var.get()}", "INFO")
        else:
            target_ip = self.current_working_ip or self.get_active_ips()[0] if self.get_active_ips() else "brak"
            self.log(f"🎯 Testuję SSH: {self.ssh_user_var.get()}@{target_ip}", "INFO")

        # Test podstawowy - echo
        stdout, stderr, code = self.run_command_ssh("echo 'SSH test działa'")

        if code == 0 and "SSH test działa" in stdout:
            self.log("✅ SSH: Połączenie działa!", "SUCCESS")

            # Test dodatkowy - sprawdź czy jesteśmy w home dir
            stdout, stderr, code = self.run_command_ssh("pwd && whoami")
            if code == 0:
                self.log(f"📁 Katalog: {stdout.strip()}", "INFO")

            # Test dostępu do dawid-app
            stdout, stderr, code = self.run_command_ssh("ls -la ~/dawid-app/")
            if code == 0 and "app.py" in stdout:
                self.log("✅ Dostęp do ~/dawid-app/: OK", "SUCCESS")
            else:
                self.log("⚠️ Brak dostępu do ~/dawid-app/ lub brak app.py", "WARNING")

        else:
            self.log("❌ SSH: Połączenie nie działa!", "ERROR")
            if stderr:
                self.log(f"Błąd: {stderr}", "ERROR")

            self.log("🔧 ROZWIĄZANIA:", "ANALYSIS")
            if self.use_alias_var.get():
                self.log("1. Sprawdź konfigurację SSH w pliku ~/.ssh/config", "ANALYSIS")
                self.log("2. Uruchom w PowerShell: ssh frpi", "ANALYSIS")
                self.log("3. Jeśli nie działa, sprawdź klucze SSH", "ANALYSIS")
            else:
                self.log("1. Sprawdź czy SSH działa: ssh filip@192.168.1.144", "ANALYSIS")
                self.log("2. Sprawdź klucze SSH lub użyj aliasu", "ANALYSIS")

        self.set_status("Test SSH zakończony")

    def check_system_status(self):
        if not self.current_working_ip:
            self.log("❌ Brak aktywnego IP! Najpierw znajdź działające IP.", "ERROR")
            return

        self.set_status("Sprawdzanie stanu systemu...", True)
        threading.Thread(target=self._check_system_thread, daemon=True).start()

    def _check_system_thread(self):
        self.log(f"=== STAN SYSTEMU {self.current_working_ip} ===", "INFO")

        # Procesy Python
        self.log("🐍 Sprawdzam procesy Python...")
        stdout, stderr, code = self.run_command_ssh("ps aux | grep python | grep -v grep")
        if stdout.strip():
            self.log("✅ Znalezione procesy Python:", "SUCCESS")
            for line in stdout.strip().split('\n'):
                if 'app.py' in line:
                    self.log(f"  🎯 DAWID APP: {line.strip()}", "SUCCESS")
                else:
                    self.log(f"  • {line.strip()}", "INFO")
        else:
            self.log("❌ Brak procesów Python!", "ERROR")
            self.log("🔧 ROZWIĄZANIE: cd ~/dawid-app && source venv/bin/activate && python app.py", "ANALYSIS")

        # Port check
        port = int(self.port_var.get())
        self.log(f"🚪 Sprawdzam port {port}...")
        stdout, stderr, code = self.run_command_ssh(
            f"sudo netstat -tlnp | grep :{port} || sudo ss -tlnp | grep :{port}")
        if stdout.strip():
            self.log(f"✅ Port {port} jest używany:", "SUCCESS")
            self.log(f"  {stdout.strip()}", "INFO")
        else:
            self.log(f"❌ Port {port} nie jest używany", "ERROR")

        # Pamięć RAM
        self.log("💾 Sprawdzam użycie pamięci...")
        stdout, stderr, code = self.run_command_ssh("free -h")
        if stdout:
            lines = stdout.strip().split('\n')
            for line in lines:
                if 'Mem:' in line:
                    parts = line.split()
                    if len(parts) >= 3:
                        used_mb = parts[2]
                        available_mb = parts[6] if len(parts) > 6 else parts[3]
                        self.log(f"📊 RAM: używane {used_mb}, dostępne {available_mb}", "INFO")

                        # Analiza użycia pamięci
                        if 'M' in used_mb:
                            try:
                                used_val = float(used_mb.replace('Mi', '').replace('M', ''))
                                if used_val > 400:  # Pi Zero ma 512MB
                                    self.log("⚠️ OSTRZEŻENIE: Wysokie użycie pamięci RAM!", "WARNING")
                                    self.log("🔧 ROZWIĄZANIE: sudo reboot", "ANALYSIS")
                                else:
                                    self.log("✅ Użycie pamięci RAM: OK", "SUCCESS")
                            except:
                                pass

        # Logi aplikacji
        self.log("📋 Sprawdzam logi aplikacji...")
        stdout, stderr, code = self.run_command_ssh("cd ~/dawid-app && tail -n 10 dawid.log 2>/dev/null")
        if stdout.strip():
            self.log("📋 Ostatnie 10 linii z dawid.log:", "INFO")
            for line in stdout.strip().split('\n'):
                if 'ERROR' in line.upper() or 'EXCEPTION' in line.upper():
                    self.log(f"  ❌ {line}", "ERROR")
                else:
                    self.log(f"  📝 {line}", "INFO")
        else:
            self.log("⚠️ Nie można odczytać logów aplikacji", "WARNING")

        self.set_status("Sprawdzanie systemu zakończone")

    def run_full_diagnostics(self):
        self.set_status("Uruchamianie pełnej diagnostyki...", True)
        threading.Thread(target=self._full_diagnostics_thread, daemon=True).start()

    def _full_diagnostics_thread(self):
        self.log("🔍 === PEŁNA DIAGNOSTYKA DAWID AI (MULTI-IP) === 🔍", "INFO")
        self.log(f"System: {platform.system()} {platform.release()}", "INFO")
        self.log("=" * 60, "INFO")

        # Znajdź działające IP
        if not self.current_working_ip:
            self._find_working_ip_thread()
            self.log("\n" + "=" * 60, "INFO")

        if self.current_working_ip:
            # Test SSH
            self._test_ssh_thread()
            self.log("\n" + "=" * 60, "INFO")

            # Stan systemu
            self._check_system_thread()
            self.log("\n" + "=" * 60, "INFO")

            # Test funkcjonalny API
            self.log("🧪 Test funkcjonalny API...")
            try:
                port = int(self.port_var.get())
                test_data = {"message": "test diagnostyczny"}
                response = requests.post(f"http://{self.current_working_ip}:{port}/chat",
                                         json=test_data, timeout=15)

                if response.status_code == 200:
                    self.log("✅ API: Test funkcjonalny przeszedł pomyślnie", "SUCCESS")
                    resp_data = response.json()
                    self.log(f"  Odpowiedź: {resp_data.get('response', 'brak odpowiedzi')}", "INFO")
                else:
                    self.log(f"❌ API: Test funkcjonalny failed (status: {response.status_code})", "ERROR")
            except Exception as e:
                self.log(f"❌ API: Test funkcjonalny error - {e}", "ERROR")

        # Podsumowanie
        self.log("\n" + "=" * 60, "INFO")
        self.log("📊 === PODSUMOWANIE DIAGNOSTYKI ===", "ANALYSIS")

        if self.current_working_ip:
            self.log(f"✅ Działające IP: {self.current_working_ip}", "SUCCESS")
        else:
            self.log("❌ Nie znaleziono działającego IP", "ERROR")

        self.log("✅ Diagnostyka zakończona!", "SUCCESS")
        self.log("💡 Sprawdź wyniki powyżej i zastosuj sugerowane rozwiązania", "ANALYSIS")

        self.set_status("Pełna diagnostyka zakończona")

    def clear_output(self):
        self.output_text.delete(1.0, tk.END)
        self.set_status("Gotowy do diagnostyki")


def main():
    root = tk.Tk()

    # Style
    style = ttk.Style()
    style.theme_use('clam')

    app = DawidDiagnostics(root)

    # Instrukcja przy starcie
    app.log("🎯 Diagnostyka Dawida", "SUCCESS")
    app.log("🚀 QUICK START:")
    app.log("1. Sprawdź czy IP są poprawne w konfiguracji")
    app.log("2. Kliknij 'Test SSH' aby sprawdzić połączenie z frpi")
    app.log("3. Jeśli SSH działa, użyj 'Znajdź Działające IP'")
    app.log("4. Na końcu 'Pełna Diagnostyka' dla pełnego przeglądu")
    app.log("=" * 70)

    root.mainloop()


if __name__ == "__main__":
    main()