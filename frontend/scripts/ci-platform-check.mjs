import {
  mkdtempSync,
  writeFileSync,
  existsSync,
  rmSync,
  mkdirSync,
  cpSync,
} from "node:fs";
import { resolve, dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function checks(directory) {
  const commands = [
    ["ci"],
    ...["check:names", "typecheck", "lint", "test", "build"].map((name) => [
      "run",
      name,
    ]),
  ];
  for (const args of commands) {
    const result = spawnSync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      args,
      { cwd: directory, stdio: "inherit", shell: process.platform === "win32" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(`npm ${args.join(" ")} failed (${result.status})`);
  }
}
if (process.platform !== "darwin") checks(frontend);
else {
  const temporary = mkdtempSync(join(dirname(frontend), ".skynexus-fs-probe-"));
  const device = execFileSync("df", ["-P", frontend], { encoding: "utf8" })
    .trim()
    .split("\n")
    .at(-1)
    .trim()
    .split(/\s+/)[0];
  execFileSync("diskutil", ["info", device], { stdio: "inherit" });
  let mounted = false;
  const mount = join(temporary, "volume");
  try {
    writeFileSync(join(temporary, "CaseProbe"), "probe");
    const insensitive = existsSync(join(temporary, "caseprobe"));
    process.stdout.write(
      `macOS checkout filesystem: ${insensitive ? "case-insensitive" : "case-sensitive"}\n`,
    );
    if (insensitive) checks(frontend);
    else {
      const image = join(temporary, "build.sparseimage");
      execFileSync(
        "hdiutil",
        [
          "create",
          "-size",
          "3g",
          "-fs",
          "APFS",
          "-volname",
          "SkyNexusCI",
          "-type",
          "SPARSE",
          "-o",
          image,
        ],
        { stdio: "inherit" },
      );
      mkdirSync(mount);
      execFileSync(
        "hdiutil",
        ["attach", image, "-mountpoint", mount, "-nobrowse"],
        { stdio: "inherit" },
      );
      mounted = true;
      writeFileSync(join(mount, "CaseProbe"), "probe");
      if (!existsSync(join(mount, "caseprobe")))
        throw new Error("Build volume must be case-insensitive");
      process.stdout.write(
        "macOS verification filesystem: case-insensitive APFS volume\n",
      );
      const repository = dirname(frontend),
        destination = join(mount, "repository");
      cpSync(repository, destination, {
        recursive: true,
        filter: (path) =>
          ![
            ".git",
            "node_modules",
            "dist",
            ".venv",
            "test-results",
            "playwright-report",
          ].includes(basename(path)) && !path.startsWith(temporary),
      });
      checks(join(destination, "frontend"));
    }
  } finally {
    if (mounted)
      execFileSync("hdiutil", ["detach", mount], { stdio: "inherit" });
    rmSync(temporary, { recursive: true, force: true });
  }
}
