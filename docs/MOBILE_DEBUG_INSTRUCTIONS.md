# Mobile Debug System - Developer Instructions

## 🚀 Quick Start Guide

This system lets you see your mobile web app's console logs in real-time on your Mac terminal. Perfect for debugging mobile apps where you can't easily access developer tools.

## 📱 Step 1: Add Debug Script to Your App

Add this script to your HTML (in `<head>` or before closing `</body>`):

```html
<script>
  (function(){
    var debug = new URL(location).searchParams.get('debug');
    if(debug === 'on'){
      var script = document.createElement('script');
      script.src = 'https://dev-tools.zurielyahav.com/debug/mobile-console-interceptor.min.js';
      script.onerror = function() {
        console.warn('Failed to load mobile debug script');
      };
      document.head.appendChild(script);
    }
  })();
</script>
```

## 🔍 Step 2: Find Your Mac's IP Address

In your Mac terminal, run:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for something like: `inet 192.168.1.100` - that's your IP address.

## 📲 Step 3: Test on Your Mobile Device

### For HTTP Apps (localhost, staging):
Open your app with these URL parameters:
```
http://yourapp.com?debug=on&debugHttp=http://192.168.1.100:3001/log
```

### For HTTPS Apps (production, Vercel, etc.):
Open your app with these URL parameters:
```
https://yourapp.com?debug=on&debugWs=ws://192.168.1.100:3001
```

**Replace `192.168.1.100` with your actual Mac IP address!**

## 👀 Step 4: Watch Logs in Terminal

Open Terminal on your Mac and you'll see logs streaming in real-time:

```
[log] 🚀 App started
[error] ❌ API call failed: Network timeout
[info] 📱 User clicked login button
[warn] ⚠️ Deprecated function used
[touch] {'touches': 1, 'clientX': 187, 'clientY': 400, 'target': 'BUTTON'}
```

## 💡 What Gets Logged Automatically

- **All console methods**: `console.log()`, `console.error()`, `console.warn()`, `console.info()`
- **JavaScript errors**: Uncaught exceptions and unhandled promise rejections
- **Touch events**: Tap locations and target elements (throttled)
- **Device info**: User agent, viewport size, pixel ratio

## 🛠 Advanced Usage

### Environment-Based Loading
```html
<script>
  (function(){
    var isDev = location.hostname === 'localhost' || location.hostname.includes('dev');
    var debugParam = new URL(location).searchParams.get('debug') === 'on';
    
    if(isDev || debugParam){
      var script = document.createElement('script');
      script.src = 'https://dev-tools.zurielyahav.com/debug/mobile-console-interceptor.min.js';
      document.head.appendChild(script);
    }
  })();
</script>
```

### Persistent Debug Mode
Add this to enable debug mode via localStorage:
```javascript
// Enable debug mode persistently
localStorage.setItem('debug', 'on');

// Disable debug mode
localStorage.removeItem('debug');
```

## 🔧 URL Parameters Reference

| Parameter | Description | Example |
|-----------|-------------|---------|
| `debug=on` | Enables debug mode | Required |
| `debugHttp=URL` | HTTP endpoint for logs | `http://192.168.1.100:3001/log` |
| `debugWs=URL` | WebSocket endpoint | `ws://192.168.1.100:3001` |

## 📝 Example Usage in Your Code

```javascript
// These will appear in your Mac terminal when debug=on
console.log('User logged in:', user.email);
console.error('Payment failed:', error.message);
console.warn('Using deprecated API');
console.info('Cache cleared');

// Objects and arrays work too
console.log('User data:', { id: 123, name: 'John' });
console.error('Validation errors:', ['Email required', 'Password too short']);
```

## 🚨 Troubleshooting

### "No logs appearing"
1. Check your Mac IP address is correct
2. Ensure your phone is on the same Wi-Fi network
3. Verify the debug server is running: `curl http://localhost:3001/health`
4. Check browser console for script loading errors

### "Script failed to load"
1. Verify the CDN URL is accessible: https://dev-tools.zurielyahav.com/debug/mobile-console-interceptor.min.js
2. Check for CORS issues in browser console
3. Try using HTTP instead of HTTPS for local testing

### "Connection refused"
1. Make sure the debug server is running on port 3001
2. Check firewall settings on your Mac
3. Verify you're using the correct IP address

## 🔒 Security Notes

- Debug mode only activates when `debug=on` parameter is present
- Safe to leave the script in production code
- No data is sent when debug mode is off
- All communication happens on your local network

## 📱 Supported Devices

- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Android Firefox
- ✅ Any mobile browser with JavaScript support

---

**Need help?** The debug server runs automatically on your Mac. Just focus on adding the script to your app and using the URL parameters!
