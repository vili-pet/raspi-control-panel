# Raspberry Pi Control Panel - Deployment Guide

Tämä ohje auttaa sinua asentamaan ja käyttämään Raspberry Pi Control Panel -sovellusta.

## Vaatimukset

- Raspberry Pi (mikä tahansa malli, suositus: Pi 3 tai uudempi)
- Raspberry Pi OS (Bullseye tai uudempi)
- Node.js 18+ ja pnpm
- MySQL/MariaDB tietokanta
- Sudo-oikeudet

## Asennus

### 1. Valmistele Raspberry Pi

```bash
# Päivitä järjestelmä
sudo apt update && sudo apt upgrade -y

# Asenna Node.js (jos ei ole vielä asennettu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Asenna pnpm
sudo npm install -g pnpm

# Asenna MariaDB
sudo apt install -y mariadb-server
sudo mysql_secure_installation
```

### 2. Luo tietokanta

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE raspi_control;
CREATE USER 'raspi_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON raspi_control.* TO 'raspi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Lataa ja asenna sovellus

```bash
# Kloonaa projekti (tai lataa ZIP)
cd /home/pi
git clone <repository-url> raspi-control-panel
cd raspi-control-panel

# Asenna riippuvuudet
pnpm install
```

### 4. Konfiguroi ympäristömuuttujat

Luo `.env` tiedosto projektin juureen:

```bash
DATABASE_URL="mysql://raspi_user:your_password@localhost:3306/raspi_control"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### 5. Alusta tietokanta

```bash
pnpm db:push
```

### 6. Käynnistä sovellus

#### Kehitystila (testaus)

```bash
pnpm dev
```

Sovellus käynnistyy osoitteessa `http://localhost:3000`

#### Tuotantotila

```bash
# Rakenna sovellus
pnpm build

# Käynnistä
pnpm start
```

## Systemd-palvelun luominen (automaattinen käynnistys)

Luo tiedosto `/etc/systemd/system/raspi-control.service`:

```ini
[Unit]
Description=Raspberry Pi Control Panel
After=network.target mysql.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/raspi-control-panel
Environment="NODE_ENV=production"
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Aktivoi palvelu:

```bash
sudo systemctl daemon-reload
sudo systemctl enable raspi-control
sudo systemctl start raspi-control
sudo systemctl status raspi-control
```

## n8n-integraatio

Jos haluat käyttää n8n-integraatiota:

```bash
# Asenna n8n globaalisti
sudo npm install -g n8n

# Käynnistä n8n
n8n start

# Tai luo systemd-palvelu n8n:lle
```

## Käyttö

1. Avaa selaimessa `http://<raspberry-pi-ip>:3000`
2. Kirjaudu sisään Manus-tilillä
3. Hallintapaneeli näyttää reaaliaikaiset järjestelmätiedot
4. Käytä sivupalkkia navigoidaksesi eri toimintoihin:
   - **Dashboard**: Järjestelmän tila (CPU, RAM, lämpötila, levytila)
   - **Files**: Tiedostojen hallinta
   - **Processes**: Prosessien tarkastelu ja hallinta
   - **Terminal**: Komentojen suoritus
   - **Services**: Systemd-palveluiden hallinta
   - **Network**: Verkkoasetukset ja tiedot
   - **n8n**: n8n workflow automation hallinta

## Turvallisuus

**TÄRKEÄÄ**: Tämä sovellus antaa laajat oikeudet järjestelmään. Suojaa se:

1. Käytä vahvaa salasanaa tietokannalle
2. Vaihda JWT_SECRET satunnaiseksi merkkijonoksi
3. Käytä palomuurisääntöjä rajoittamaan pääsyä
4. Harkitse HTTPS:n käyttöönottoa (esim. Nginx reverse proxy)
5. Älä altista sovellusta julkiseen internettiin ilman suojausta

## Vianmääritys

### Sovellus ei käynnisty

```bash
# Tarkista lokit
journalctl -u raspi-control -f

# Tarkista tietokantayhteys
mysql -u raspi_user -p raspi_control
```

### Ei oikeuksia komentojen suoritukseen

Sovellus tarvitsee sudo-oikeudet tietyille komennoille. Lisää `/etc/sudoers.d/raspi-control`:

```
pi ALL=(ALL) NOPASSWD: /bin/systemctl
```

### Port jo käytössä

Vaihda portti `.env` tiedostossa ja käynnistä uudelleen.

## Päivitys

```bash
cd /home/pi/raspi-control-panel
git pull
pnpm install
pnpm build
sudo systemctl restart raspi-control
```

## Tuki

Jos kohtaat ongelmia, tarkista:
- Lokit: `journalctl -u raspi-control -f`
- Tietokantayhteys
- Node.js ja pnpm versiot
- Palomuurisäännöt
