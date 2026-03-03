---
description: Audit and update vulnerable dependencies
---

Perform a comprehensive security audit and update vulnerable dependencies:

1. **Initial Audit**:
   - Run `npm audit` to identify all vulnerabilities
   - Run `npm outdated` to check for outdated packages
   - Categorize vulnerabilities by severity (critical, high, moderate, low)

2. **Automatic Fixes**:
   - Run `npm audit fix` to automatically fix vulnerabilities that don't require breaking changes
   - Document which packages were updated

3. **Manual Review** (if automatic fixes are insufficient):
   - Identify packages requiring manual updates or breaking changes
   - Check changelogs for affected packages
   - Use `npm audit fix --force` only if necessary (ask user first)
   - Consider alternative packages if updates aren't available

4. **Verification**:
   - Run `npm test` to ensure tests still pass
   - Run `npm run dev` briefly to verify the application starts
   - Re-run `npm audit` to confirm vulnerabilities are resolved

5. **Documentation**:
   - List all updated packages with version changes
   - Note any breaking changes or migration steps needed
   - Warn about any remaining vulnerabilities that couldn't be fixed

**Important Notes**:
- Always create a git commit before starting updates (if not already done)
- Test the application after updates
- Some vulnerabilities in dev dependencies may be acceptable (discuss with user)
- If vulnerabilities require major version updates, discuss trade-offs with user
