import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/Card";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  const caseStudyPath = project.caseStudyPath;
  const isInternal = Boolean(caseStudyPath);
  const primaryHref = caseStudyPath ?? project.url;

  const className = [
    "block rounded-2xl outline-offset-2 transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:hover:translate-y-0",
    project.isEarlyWork ? "opacity-90" : "",
    project.isFeatured ? "md:-mt-2" : "",
  ].join(" ");

  const cardClassName = [
    "group h-full overflow-hidden",
    project.isFeatured ? "ring-1 ring-indigo-500/25" : "",
    "hover:border-indigo-200/70 hover:shadow-lg hover:shadow-indigo-950/[0.06]",
  ].join(" ");

  const body = (
    <Card className={cardClassName}>
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={project.imageSrc}
          alt={`${project.name} preview`}
          fill
          className="object-cover opacity-90 transition duration-500 ease-out group-hover:scale-[1.02] group-hover:opacity-100 motion-reduce:group-hover:scale-100"
          sizes="(min-width: 1024px) 520px, (min-width: 640px) 50vw, 100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/0 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-white/85 px-2.5 py-1 text-xs font-medium text-slate-900">
          {project.label}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-white">
                {project.name}
              </div>
              <div className="text-xs text-white/80">{project.tagline}</div>
            </div>
            <span className="shrink-0 rounded-lg border border-white/25 bg-white/20 px-2 py-1 text-xs font-medium text-white transition group-hover:bg-white/30">
              {isInternal ? "Case study" : "Open site"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm leading-relaxed text-slate-700">
          {project.outcome}
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-slate-800">
          {project.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {isInternal ? (
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Opens the internal case study with relationship disclosure and
            live-site proof.
          </p>
        ) : null}
      </div>
    </Card>
  );

  return (
    <div className="flex h-full flex-col gap-2">
      {isInternal ? (
        <Link href={primaryHref} className={className}>
          {body}
        </Link>
      ) : (
        <a
          href={primaryHref}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {body}
        </a>
      )}
      {isInternal ? (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-xs font-medium text-slate-700 underline-offset-4 hover:underline"
        >
          Open live {project.name} site
        </a>
      ) : null}
    </div>
  );
}
