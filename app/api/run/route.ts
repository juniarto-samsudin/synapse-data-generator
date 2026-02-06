import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

// where all runs are stored
const RUNS_DIR = path.resolve(process.cwd(), "generated");
const myOutDir: Record<string, string> = {
  UpperGI: "Synthetic_UpperGI_Images",
  OCT: "Synthetic_OCT_Images",
  FUNDUS: "Synthetic_FUNDUS_Images",
  ISIC: "Synthetic_ISIC_Images",
  COVID: "Synthetic_COVID_Images",
  KidneyScan: "Synthetic_KidneyScan_Images",
  Alzhiemer: "Synthetic_Alzhiemer_Images",
};

function waitForProcess(proc: ReturnType<typeof spawn>) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    proc.stdout?.on("data", (d) => stdout.push(Buffer.from(d)));
    proc.stderr?.on("data", (d) => stderr.push(Buffer.from(d)));

    proc.on("error", reject);
    proc.on("close", (code) => {
      resolve({
        code: code ?? -1,
        stdout: Buffer.concat(stdout).toString("utf-8"),
        stderr: Buffer.concat(stderr).toString("utf-8"),
      });
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dataset: string = String(body?.dataset ?? "").trim();
    const ipc : number = Number(body?.ipc ?? 1);
    //const prompt: string = String(body?.prompt ?? "").trim();
    //const folders = Number(body?.folders ?? 3);
    //const images = Number(body?.images ?? 6);

    if (!dataset) {
      return NextResponse.json({ error: "dataset is required" }, { status: 400 });
    }
    if (!ipc || isNaN(ipc) || !Number.isInteger(ipc) || ipc <= 0) {
      return NextResponse.json({ error: "ipc must be a positive integer" }, { status: 400 });
    }

    // runId = timestamp-based. You can use UUID if you want.
    const runId = `${Date.now()}`;
    const outdir = path.join(RUNS_DIR, runId);
    console.log(`output dir: ${outdir}`);
    console.log(`dataset: ${dataset}`);
    console.log(`ipc: ${ipc}`);
    console.log(`RUNS_DIR: ${RUNS_DIR}`);

    fs.mkdirSync(outdir, { recursive: true });

    // IMPORTANT: use conda run when an env is specified; fallback to PYTHON_BIN
    const condaBin = process.env.CONDA_BIN || "conda";
    const condaEnv = String(process.env.CONDA_ENV || "").trim();
    const python = process.env.PYTHON_BIN || "python3";
    if (condaEnv) {
      console.log(`Using conda env: ${condaEnv} (conda: ${condaBin})`);
    } else {
      console.log(`Using python binary: ${python}`);
    }

    /*
    parser.add_argument('--ipc', type=int, default=50)
    parser.add_argument('--data', type=str, default='UpperGI')
    parser.add_argument('--batch_size', type=int, default=10)
    parser.add_argument('--output_dir', type=str,
                        default='./Synthetic_UpperGI_Images/')
    */

    /* const proc = spawn(
      python,
      [
        "python/generate.py",
        "--outdir",
        outdir,
        "--prompt",
        prompt,
        "--folders",
        String(folders),
        "--images",
        String(images),
      ],
      { cwd: process.cwd() }
    ); */

    const proc = condaEnv
      ? spawn(
          condaBin,
          ["run", "-n", condaEnv, "python", "test_all.py",
            "--data", dataset,
            "--ipc", String(ipc),
          ],
          {
            cwd: process.env.GENERATOR_DIR,
            env: { ...process.env },
          }
        )
      : spawn(
          python,
          ["test_all.py"],
          {
            cwd: process.env.GENERATOR_DIR,
            env: { ...process.env },
          }
        );

    const result = await waitForProcess(proc);
    
    if (result.code !== 0) {
      return NextResponse.json(
        { error: "python failed", code: result.code, stderr: result.stderr },
        { status: 500 }
      );
    } 

    return NextResponse.json({
      runId,
      //outdir,
      outputSubdir: myOutDir[dataset],
      message: "ok",
    });
  } catch (e: any) {
    return NextResponse.json({ error: "server error", detail: String(e) }, { status: 500 });
  }
}
