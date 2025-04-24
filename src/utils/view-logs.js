#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Get log directory
const logsDir = path.join(__dirname, '../../logs');

// Get command line args
const args = process.argv.slice(2);
const logType = args[0] || 'combined'; // Default to combined logs
const date = args[1] || getCurrentDate(); // Default to current date
const lines = parseInt(args[2]) || 50; // Default to last 50 lines

// Determine log file to read
const logFile = path.join(logsDir, `${logType}-${date}.log`);

// Check if log file exists
if (!fs.existsSync(logFile)) {
  console.error(`Error: Log file ${logFile} not found`);
  console.log('Available log files:');
  fs.readdirSync(logsDir).forEach(file => {
    console.log(`- ${file}`);
  });
  process.exit(1);
}

// Read last N lines from log file
const logTail = async (filePath, numLines) => {
  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const lines = [];
    
    for await (const line of rl) {
      lines.push(line);
      if (lines.length > numLines) {
        lines.shift(); // Remove oldest line
      }
    }
    
    return lines;
  } catch (error) {
    console.error(`Error reading log file: ${error.message}`);
    return [];
  }
};

// Main function
const viewLogs = async () => {
  console.log(`Viewing last ${lines} lines of ${logFile}:\n`);
  
  const logLines = await logTail(logFile, lines);
  
  logLines.forEach(line => {
    // Color formatting based on log level
    if (line.includes(' ERROR ')) {
      console.log('\x1b[31m%s\x1b[0m', line); // Red for errors
    } else if (line.includes(' WARN ')) {
      console.log('\x1b[33m%s\x1b[0m', line); // Yellow for warnings
    } else if (line.includes(' INFO ')) {
      console.log('\x1b[32m%s\x1b[0m', line); // Green for info
    } else if (line.includes(' DEBUG ')) {
      console.log('\x1b[36m%s\x1b[0m', line); // Cyan for debug
    } else {
      console.log(line); // Default color for others
    }
  });
};

// Execute the main function
viewLogs();

// Usage instructions
console.log('\nUsage: node view-logs.js [logType] [date] [lines]');
console.log('  logType: "error" or "combined" (default: "combined")');
console.log('  date: YYYY-MM-DD (default: current date)');
console.log('  lines: Number of lines to display (default: 50)'); 