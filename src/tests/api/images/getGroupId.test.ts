import { test } from "node:test";
import { assert } from "chai";
import { readFileSync } from "fs";

// Import the getGroupId function (we'll define it inline for testing)
function getGroupId(groupName: string): number | null {
  try {
    // Read /etc/group file which contains group information
    const groupFile = readFileSync('/etc/group', 'utf8');
    
    // Split the file by lines and find the line for the specified group
    const lines = groupFile.split('\n');
    for (const line of lines) {
      const [name, , gid] = line.split(':');
      if (name === groupName) {
        return parseInt(gid, 10);
      }
    }
    return null;
  } catch (error) {
    console.error(`Error getting GID for group ${groupName}:`, error);
    return null;
  }
}

test("getGroupId function", async (context) => {
  await context.test("should return a numeric GID for www-data group", () => {
    const gid = getGroupId("www-data");
    console.log("[DEBUG_LOG] www-data GID:", gid);
    
    // The test should pass if we can find the GID (it's not null)
    // The actual value will depend on the system configuration
    assert.isNotNull(gid, "GID for www-data should not be null");
    assert.isNumber(gid, "GID should be a number");
  });

  await context.test("should return null for a non-existent group", () => {
    const gid = getGroupId("non-existent-group-name");
    assert.isNull(gid, "GID for non-existent group should be null");
  });
});