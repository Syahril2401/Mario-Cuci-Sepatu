const db = require('./src/config/db');

async function checkAndCleanImages() {
  try {
    const [services] = await db.execute('SELECT service_id, serviceName, image FROM services');
    
    console.log('\n=== SERVICE IMAGE STATUS ===');
    let fixed = 0;
    
    for (const svc of services) {
      const img = svc.image;
      
      if (!img || img === null) {
        console.log(`⬜ [${svc.service_id}] ${svc.serviceName}: NULL (no image)`);
        continue;
      }
      
      // Check if it's a valid base64 - must be complete (at least 10KB for a tiny image)
      if (img.startsWith('data:image')) {
        const base64Part = img.split(',')[1] || '';
        const sizeKB = Math.round(base64Part.length * 0.75 / 1024);
        
        if (sizeKB < 5) {
          // Too small - likely truncated/corrupted
          console.log(`🔴 [${svc.service_id}] ${svc.serviceName}: CORRUPTED base64 (only ${sizeKB}KB) → Setting to NULL`);
          await db.execute('UPDATE services SET image = NULL WHERE service_id = ?', [svc.service_id]);
          fixed++;
        } else {
          console.log(`✅ [${svc.service_id}] ${svc.serviceName}: Valid base64 (${sizeKB}KB)`);
        }
      } else if (img.startsWith('http')) {
        console.log(`✅ [${svc.service_id}] ${svc.serviceName}: Valid URL`);
      } else {
        console.log(`🔴 [${svc.service_id}] ${svc.serviceName}: Unknown format → Setting to NULL`);
        await db.execute('UPDATE services SET image = NULL WHERE service_id = ?', [svc.service_id]);
        fixed++;
      }
    }
    
    console.log(`\n=== DONE: Fixed ${fixed} corrupted image(s) ===\n`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkAndCleanImages();
