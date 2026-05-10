/* eslint-disable n/no-process-env */
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envSchema = z.object({
  NEXT_PUBLIC_BACKEND_URL: z.url(),
});

const env = envSchema.parse(process.env);

const OUTPUT_PATH = path.join(__dirname, "../configs/all-permissions.ts");

function transformPermissionKey(key) {
  // Convert hyphens and colons to underscores, then uppercase
  return key.replace(/[-:]/g, "_").toUpperCase();
}

function groupPermissions(allPermissions) {
  const grouped = {};

  for (const permCode in allPermissions) {
    const [category, action] = permCode.split(":");

    if (!category || !action) continue;

    const categoryKey = transformPermissionKey(category);
    const actionKey = transformPermissionKey(action);

    if (!grouped[categoryKey]) {
      grouped[categoryKey] = {};
    }

    grouped[categoryKey][actionKey] = permCode;
  }

  return grouped;
}

function generateTypeScriptContent(permissions) {
  const lines = ["const PERMS = {"];

  for (const [category, actions] of Object.entries(permissions)) {
    lines.push(`  ${category}: {`);

    for (const [action, permCode] of Object.entries(actions)) {
      lines.push(`    ${action}: "${permCode}",`);
    }

    lines.push("  },");
  }

  lines.push("};");
  lines.push("");
  lines.push("export default PERMS;");

  return lines.join("\n");
}

function writeEmptyPermissionsFile(error) {
  const emptyContent = `const PERMS = {};\n\nexport default PERMS;\n`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, emptyContent, "utf8");

  console.error("Error fetching permissions:", error.message);
  console.log("Created empty permissions file at:", OUTPUT_PATH);
}

async function generatePermissions() {
  try {
    console.log("Fetching permissions from API...");

    const apiUrl = `${env.NEXT_PUBLIC_BACKEND_URL}/url-permissions?allPermissions=true`;
    console.log("Using API URL:", apiUrl);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const { allPermissions } = data;

    if (!allPermissions || typeof allPermissions !== "object") {
      throw new Error("Invalid response format: missing allPermissions");
    }

    console.log(`Found ${Object.keys(allPermissions).length} permissions`);

    const grouped = groupPermissions(allPermissions);
    const content = generateTypeScriptContent(grouped);

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, content, "utf8");

    console.log("✓ Permissions file generated successfully at:", OUTPUT_PATH);
    console.log(
      `✓ Generated ${Object.keys(grouped).length} permission categories`
    );
  } catch (error) {
    writeEmptyPermissionsFile(error);
  }
}

generatePermissions();
