import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicProjectBySlug } from "@/lib/repositories/public-projects";
import type { Media } from "@/domain/types";
import { FadeInSection } from "./fade-in-section";
import { SpecificationsAccordion } from "./specifications-accordion";
import { SiteNav } from "./site-nav";
import { Lightbox } from "./lightbox";

interface PageProps {
  params: Promise<{ orgSlug: string; projectSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { orgSlug, projectSlug } = await params;
  const project = await getPublicProjectBySlug(orgSlug, projectSlug);

  if (!project) return {};

  return {
    title: project.name,
    description: project.subtitle ?? project.description ?? undefined,
    robots: project.seoIndexable ? undefined : { index: false, follow: false },
  };
}

function byType(media: Media[], type: Media["type"]) {
  return media.filter((m) => m.type === type);
}

export default async function ProjectPage({ params }: PageProps) {
  const { orgSlug, projectSlug } = await params;
  const project = await getPublicProjectBySlug(orgSlug, projectSlug);

  if (!project) notFound();

  const moodboard = byType(project.media, "moodboard");
  const floorPlans = byType(project.media, "floor_plan");
  const documents = byType(project.media, "document");
  const renders = byType(project.media, "render");

  const generalSpecs = project.specificationItems.filter(
    (s) => !s.environmentId,
  );

  const coverImage =
    project.heroImage ??
    renders[0]?.url ??
    project.media.find((m) => m.type === "photo")?.url ??
    null;

  const environmentsWithRenders = project.environments.filter((env) =>
    renders.some((m) => m.environmentId === env.id),
  );
  const totalEnvironments = environmentsWithRenders.length;

  const navItems = [
    { id: "apresentacao", label: "Apresentação" },
    environmentsWithRenders.length > 0 && { id: "projeto", label: "Projeto" },
    (floorPlans.length > 0 || documents.length > 0) && {
      id: "tecnico",
      label: "Desenhos",
    },
    project.stages.length > 0 && { id: "percurso", label: "Percurso" },
  ].filter((x): x is { id: string; label: string } => Boolean(x));

  const location = [project.city, project.state].filter(Boolean).join(" · ");

  return (
    <main className="bg-brand-cream text-brand-charcoal" id="top">
      <SiteNav items={navItems} />

      {/* CAPA — tipografia como protagonista, sem imagem de fundo */}
      <section className="relative grid min-h-screen place-items-center overflow-hidden px-[7vw]">
        {/* círculos de contorno sutis nos cantos (assinatura visual) */}
        <span className="pointer-events-none absolute -right-[34vw] -top-[34vw] h-[64vw] w-[64vw] rounded-full border border-brand-camel/20" />
        <span className="pointer-events-none absolute -bottom-[50vw] -left-[45vw] h-[64vw] w-[64vw] rounded-full border border-brand-camel/20" />

        <div className="relative z-10 w-full max-w-[1150px]">
          {location && (
            <p className="text-[10px] uppercase tracking-[0.25em] text-brand-camel">
              {location}
            </p>
          )}
          <h1 className="my-7 font-serif text-[clamp(34px,5.5vw,74px)] font-normal leading-[0.84] tracking-[-0.04em]">
            {project.name}
          </h1>
          <div className="mb-7 h-px w-[110px] bg-brand-camel" />
          {project.subtitle && (
            <p className="text-[13px] uppercase leading-[1.8] tracking-[0.08em] text-brand-sage">
              {project.subtitle}
            </p>
          )}
        </div>

        <p className="absolute bottom-8 right-[4.5vw] text-[9px] uppercase tracking-[0.18em] text-brand-sage">
          deslize para explorar <span className="ml-2">↓</span>
        </p>
      </section>

      {/* APRESENTAÇÃO — conceito + moodboard lado a lado */}
      {(project.description || moodboard.length > 0 || coverImage) && (
        <section
          id="apresentacao"
          className="scroll-mt-16 bg-brand-greige/15 px-[7vw] py-[120px]"
        >
          <div className="mx-auto grid max-w-[900px] items-center gap-[6vw] md:grid-cols-[1fr_1fr]">
            <FadeInSection variant="slide-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-brand-camel">
                Apresentação
              </p>
              <h2 className="my-4 font-serif text-[clamp(24px,2.7vw,36px)] leading-[1.05] tracking-[-0.03em]">
                O projeto e<br />sua atmosfera.
              </h2>
              {project.description && (
                <p className="max-w-[580px] whitespace-pre-line text-[13px] leading-[1.9] text-brand-sage">
                  {project.description}
                </p>
              )}
            </FadeInSection>

            <FadeInSection variant="zoom">
              {moodboard.length > 0 ? (
                <figure className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={moodboard[0].url}
                    alt={moodboard[0].title ?? "Moodboard"}
                    loading="lazy"
                    decoding="async"
                    className="w-full shadow-[0_18px_60px_rgba(51,35,25,0.08)]"
                  />
                  <figcaption className="mt-3 text-[10px] tracking-[0.08em] text-brand-sage">
                    {moodboard[0].description ??
                      "Moodboard · linguagem material e cromática do projeto"}
                  </figcaption>
                </figure>
              ) : coverImage ? (
                <figure className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt={project.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full shadow-[0_18px_60px_rgba(51,35,25,0.08)]"
                  />
                </figure>
              ) : null}
            </FadeInSection>
          </div>

          {generalSpecs.length > 0 && (
            <div className="mx-auto mt-12 max-w-[900px]">
              <SpecificationsAccordion
                items={generalSpecs}
                label="Materiais e equipamentos gerais"
              />
            </div>
          )}
        </section>
      )}

      {/* TRANSIÇÃO — anuncia o percurso pelos ambientes */}
      {environmentsWithRenders.length > 0 && (
        <FadeInSection
          variant="fade"
          className="flex min-h-[60vh] flex-col justify-center bg-brand-greige/35 px-[7vw] py-[12vw]"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-camel">
            Percurso pelo projeto
          </p>
          <h2 className="my-5 max-w-[980px] font-serif text-[clamp(28px,4vw,52px)] leading-[0.92] tracking-[-0.03em]">
            Ambiente a<br />ambiente.
          </h2>
          <p className="max-w-[460px] text-[13px] leading-[1.8] text-brand-sage">
            A sequência acompanha o percurso natural pelo espaço, das áreas
            comuns às mais reservadas.
          </p>
        </FadeInSection>
      )}

      {/* AMBIENTES */}
      {environmentsWithRenders.length > 0 && (
        <div id="projeto" className="scroll-mt-16">
          {environmentsWithRenders.map((env, index) => {
            const envRenders = renders.filter((m) => m.environmentId === env.id);
            const envSpecs = project.specificationItems.filter(
              (s) => s.environmentId === env.id,
            );
            const alternate = index % 2 === 1;

            return (
              <FadeInSection
                key={env.id}
                variant="fade"
                className={
                  "px-[7vw] pb-[100px] pt-[85px] " +
                  (alternate ? "bg-brand-greige/20" : "bg-brand-cream")
                }
              >
                <div className="mx-auto max-w-[820px]">
                  <div className="mb-9 grid grid-cols-[62px_1fr] items-end border-b border-brand-greige/50 pb-6 md:grid-cols-[88px_1fr]">
                    <span className="text-[11px] tracking-[0.18em] text-brand-camel">
                      {String(index + 1).padStart(2, "0")} /{" "}
                      {String(totalEnvironments).padStart(2, "0")}
                    </span>
                    <div>
                      {env.zone && (
                        <p className="mb-2 text-[9px] uppercase tracking-[0.18em] text-brand-sage">
                          {env.zone}
                        </p>
                      )}
                      <h2 className="m-0 font-serif text-[clamp(20px,2.4vw,31px)] tracking-[-0.03em]">
                        {env.name}
                      </h2>
                    </div>
                  </div>

                  {env.description && (
                    <p className="mb-7 max-w-[600px] text-[13px] leading-[1.8] text-brand-sage">
                      {env.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {envRenders.map((m) => (
                      <figure key={m.id} className="m-0 overflow-hidden">
                        <Lightbox
                          src={m.url}
                          alt={m.title ?? env.name}
                          className="aspect-[4/3] w-full object-cover md:transition-transform md:duration-[1200ms] md:ease-[cubic-bezier(0.2,0.75,0.2,1)] md:hover:scale-[1.015]"
                        />
                      </figure>
                    ))}
                  </div>

                  <SpecificationsAccordion items={envSpecs} />
                </div>
              </FadeInSection>
            );
          })}
        </div>
      )}

      {/* DESENHOS TÉCNICOS — cards com código, título e link para o arquivo */}
      {(floorPlans.length > 0 || documents.length > 0) && (
        <section
          id="tecnico"
          className="scroll-mt-16 bg-brand-greige/35 px-[7vw] py-[120px]"
        >
          <FadeInSection variant="slide-left">
            <div className="mb-14 grid items-end gap-x-[7vw] md:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-brand-camel">
                  Desenhos técnicos
                </p>
                <h2 className="mt-4 font-serif text-[clamp(23px,2.9vw,39px)] leading-[1.05] tracking-[-0.03em]">
                  Os detalhes para
                  <br />
                  além do render.
                </h2>
              </div>
              <p className="max-w-[480px] text-[13px] leading-[1.8] text-brand-sage md:self-end">
                O desenvolvimento visual é acompanhado por desenho técnico de
                layout, cortes, carpintarias e iluminação.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection variant="fade">
            <div className="mx-auto grid max-w-[820px] grid-cols-1 gap-3 md:grid-cols-2">
              {[...floorPlans, ...documents].map((m, i, arr) => {
                const href = m.fileUrl ?? m.url;
                const label =
                  m.title ??
                  (m.type === "floor_plan" ? "Planta Baixa" : "Desenho técnico");
                const isLast = i === arr.length - 1 && arr.length % 2 === 1;

                const card = (
                  <div className="bg-brand-greige/25">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt={label}
                      loading="lazy"
                      decoding="async"
                      className="h-[230px] w-full bg-brand-cream object-contain p-[16px]"
                    />
                    <div className="grid grid-cols-[70px_1fr_30px] items-center bg-brand-greige/40 px-5 py-[18px]">
                      <span className="text-[10px] tracking-[0.15em] text-brand-camel">
                        {m.code ?? ""}
                      </span>
                      <b className="font-serif text-[15px] font-normal">
                        {label}
                      </b>
                      <i className="not-italic text-brand-camel">↗</i>
                    </div>
                  </div>
                );

                return (
                  <a
                    key={m.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      "block no-underline " + (isLast ? "md:col-span-2" : "")
                    }
                  >
                    {card}
                  </a>
                );
              })}
            </div>
          </FadeInSection>
        </section>
      )}

      {/* PERCURSO / CRONOGRAMA */}
      {project.stages.length > 0 && (
        <section id="percurso" className="scroll-mt-16 px-[7vw] py-[125px]">
          <FadeInSection variant="slide-right">
            <div className="mb-16 grid items-end gap-[7vw] md:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-brand-camel">
                  Percurso
                </p>
                <h2 className="mt-4 font-serif text-[clamp(23px,2.9vw,39px)] leading-[1.05] tracking-[-0.03em]">
                  O percurso até aqui
                  <br />e o que se segue.
                </h2>
              </div>
            </div>
          </FadeInSection>

          <div className="mx-auto max-w-[820px]">
            {project.stages.map((stage) => {
              const isCurrent = stage.status === "current";
              const isDone = stage.status === "completed";

              return (
                <FadeInSection key={stage.id} variant="fade">
                  <article
                    className={
                      "relative grid grid-cols-[46px_1fr] gap-4 md:grid-cols-[82px_1fr] md:gap-6 " +
                      (isCurrent
                        ? "my-2 bg-brand-greige/40 px-5 py-7 md:-ml-[30px] md:px-[30px] md:py-8"
                        : "border-t border-brand-greige/50 py-6")
                    }
                  >
                    {(isDone || isCurrent) && (
                      <span
                        className={
                          "absolute bottom-0 top-0 w-[2px] " +
                          (isCurrent
                            ? "left-0 bg-brand-camel"
                            : "-left-[18px] bg-brand-sage/60")
                        }
                      />
                    )}
                    <span
                      className={
                        "font-serif text-[22px] " +
                        (isCurrent ? "text-brand-camel" : "text-brand-sage")
                      }
                    >
                      {String(stage.orderIndex).padStart(2, "0")}
                    </span>
                    <div>
                      {isCurrent && (
                        <small className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-brand-camel">
                          Fase atual
                        </small>
                      )}
                      <b className="mb-2 block font-serif text-[19px] font-normal md:text-[22px]">
                        {stage.name}
                      </b>
                      {stage.description && (
                        <p className="m-0 max-w-[650px] text-[14px] leading-[1.75] text-brand-sage">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </article>
                </FadeInSection>
              );
            })}
          </div>
        </section>
      )}

      {/* RODAPÉ */}
      <footer className="border-t border-brand-greige/40 px-[7vw] py-14 text-center">
        <p className="font-serif text-[26px] uppercase tracking-[0.2em] text-brand-charcoal">
          Amanda Pioner
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-brand-sage">
          Arquitetura &amp; Interiores
        </p>
      </footer>
    </main>
  );
}
