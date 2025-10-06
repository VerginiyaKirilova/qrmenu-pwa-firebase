import * as QRCode from 'qrcode';
import * as fs from 'fs-extra';
import * as path from 'path';

// Configuration
const config = {
  baseUrl: 'https://qrmenu-pwa-firebase.web.app/menu', // Replace with your actual domain
  outputDir: path.join(__dirname, 'output'),
  restaurants: [
    {
      id: 'R123',
      name: 'Demo Restaurant',
      tables: [
        { id: 'T1', label: 'Table 1' },
        { id: 'T2', label: 'Table 2' },
        { id: 'T3', label: 'Table 3' },
        { id: 'T4', label: 'Table 4' },
        { id: 'T5', label: 'Table 5' },
        { id: 'T6', label: 'Table 6' },
        { id: 'T7', label: 'Table 7' },
        { id: 'T8', label: 'Table 8' }
      ]
    }
    // Add more restaurants as needed
  ]
};

// Ensure output directory exists
async function ensureOutputDir() {
  await fs.ensureDir(config.outputDir);
  console.log(`Output directory created: ${config.outputDir}`);
}

// Generate QR code for a table
async function generateQRCode(restaurantId: string, tableId: string, tableLabel: string) {
  const url = `${config.baseUrl}?rid=${restaurantId}&table=${tableId}`;
  const outputPath = path.join(config.outputDir, `${restaurantId}_${tableId}.png`);

  try {
    await QRCode.toFile(outputPath, url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log(`Generated QR code for ${tableLabel} (${tableId}): ${url}`);
    return outputPath;
  } catch (error) {
    console.error(`Error generating QR code for ${tableId}:`, error);
    throw error;
  }
}

// Generate QR codes for all tables in all restaurants
async function generateAllQRCodes() {
  try {
    await ensureOutputDir();

    for (const restaurant of config.restaurants) {
      console.log(`\nGenerating QR codes for restaurant: ${restaurant.name} (${restaurant.id})`);

      // Create restaurant directory
      const restaurantDir = path.join(config.outputDir, restaurant.id);
      await fs.ensureDir(restaurantDir);

      // Generate QR codes for each table
      for (const table of restaurant.tables) {
        const qrPath = await generateQRCode(restaurant.id, table.id, table.label);

        // Copy to restaurant-specific directory
        const destPath = path.join(restaurantDir, `${table.id}.png`);
        await fs.copy(qrPath, destPath);

        // Create a text file with the URL for reference
        const urlFilePath = path.join(restaurantDir, `${table.id}.txt`);
        await fs.writeFile(urlFilePath, `${config.baseUrl}?rid=${restaurant.id}&table=${table.id}`);
      }

      console.log(`QR codes for ${restaurant.name} saved to: ${restaurantDir}`);
    }

    console.log('\nAll QR codes generated successfully!');
  } catch (error) {
    console.error('Error generating QR codes:', error);
    process.exit(1);
  }
}

// Run the script
generateAllQRCodes();
