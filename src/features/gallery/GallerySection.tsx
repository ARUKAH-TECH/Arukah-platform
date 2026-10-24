import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getGallery } from "@/db/gallery";

/** "Our work" photos for a page. Renders nothing until photos are added in Admin → Gallery. */
export async function GallerySection({ branch, title = "Our work", eyebrow = "Gallery" }: { branch: string; title?: string; eyebrow?: string }) {
  const photos = await getGallery(branch);
  if (photos.length === 0) return null;
  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} align="center" />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer" className="group block">
              <Image
                src={photo.url}
                alt={photo.caption || "Photo of our work"}
                width={photo.width ?? 800}
                height={photo.height ?? 800}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="aspect-square w-full rounded-xl bg-black/5 object-cover transition-opacity group-hover:opacity-90 dark:bg-white/5"
              />
              {photo.caption && <p className="mt-1.5 text-xs text-foreground/70">{photo.caption}</p>}
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
