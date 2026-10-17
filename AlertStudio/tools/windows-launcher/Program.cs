using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Windows.Forms;

internal static class Program
{
    // Windows command-line quoting; no command interpreter is involved.
    private static string Quote(string value)
    {
        var result = new System.Text.StringBuilder("\"");
        int slashes = 0;
        foreach (char character in value)
        {
            if (character == '\\') { slashes++; continue; }
            result.Append('\\', character == '"' ? slashes * 2 + 1 : slashes);
            result.Append(character);
            slashes = 0;
        }
        return result.Append('\\', slashes * 2).Append('"').ToString();
    }

    [STAThread]
    private static void Main(string[] args)
    {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string electron = Path.Combine(root, "node_modules", "electron", "dist", "electron.exe");
        string main = Path.Combine(root, "dist", "desktop", "main.cjs");
        try
        {
            if (!File.Exists(electron) || !File.Exists(main))
                throw new FileNotFoundException(
                    "Не найдены файлы приложения. Выполните pnpm install и pnpm build в папке AlertStudio.\n\n" +
                    "Application files are missing. Run pnpm install and pnpm build in the AlertStudio folder.");
            var start = new ProcessStartInfo(electron)
            {
                WorkingDirectory = root,
                Arguments = Quote(root) + (args.Length == 0 ? "" : " " + string.Join(" ", args.Select(Quote))),
                UseShellExecute = false,
                CreateNoWindow = true
            };
            start.EnvironmentVariables.Remove("ELECTRON_RUN_AS_NODE");
            using (Process process = Process.Start(start)) { }
        }
        catch (Exception error)
        {
            MessageBox.Show("Не удалось запустить AlertStudio / Unable to start AlertStudio\n\n" + error.Message,
                "AlertStudio", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
