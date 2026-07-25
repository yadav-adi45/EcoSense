import dns from "dns";

// Force Node.js to use Google's public DNS servers (8.8.8.8 and 8.8.4.4)
// This bypasses system DNS which may block MongoDB Atlas SRV record resolution
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Disable TLS certificate verification — needed for networks with SSL inspection (antivirus/proxy)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

console.log("✅ DNS forced to Google Public DNS (8.8.8.8, 8.8.4.4)");
console.log("✅ TLS verification disabled for SSL-intercepting networks");
