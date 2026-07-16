# Docker Development

## Start The App

```powershell
docker compose up --build
```

Open on this computer:

```txt
http://localhost:3000
```

Open from another device on the same Wi-Fi:

1. Find this computer's IPv4 address.

```powershell
ipconfig
```

2. Open the app with that IP.

```txt
http://YOUR_IPV4_ADDRESS:3000
```

Example:

```txt
http://192.168.1.25:3000
```

If Windows Firewall asks about Docker or Node network access, allow private network access.

## Stop The App

```powershell
docker compose down
```

## Notes

- The app runs in development mode for fast UI work.
- Source files are mounted into the container.
- `WATCHPACK_POLLING=true` helps file watching work reliably on Windows and OneDrive folders.
