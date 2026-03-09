export class OpenGraphBuilder {
  private tags: string[] = [];

  withDefaultMetadata(): this {
    this.tags.push(`
      <meta charset="utf-8" />
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta property="og:type" content="website" />
    `);
    return this;
  }

  withTitle(title: string): this {
    this.tags.push(`
      <meta property="og:title" content="${title}" />
      <meta name="twitter:title" content="${title}" />
    `);
    return this;
  }

  withDescription(desc: string): this {
    this.tags.push(`
      <meta property="og:description" content="${desc}" />
      <meta name="twitter:description" content="${desc}" />
    `);
    return this;
  }

  withUrl(url: string): this {
    this.tags.push(`
      <meta property="og:url" content="${url}" />
      <meta name="twitter:url" content="${url}" />
    `);
    return this;
  }

  withImage(url: string, type: string): this {
    this.tags.push(`
      <meta property="og:image" content="${url}" />
      <meta property="og:image:secure_url" content="${url}" />
      <meta name="twitter:image" content="${url}" />
      <meta property="og:image:type" content="${type}" />
    `);
    return this;
  }

  withVideo(url: string, type: string): this {
    this.tags.push(`
      <meta property="og:video" content="${url}" />
      <meta property="og:video:url" content="${url}" />
      <meta property="og:video:secure_url" content="${url}" />
      <meta property="og:video:type" content="${type}" />
    `);
    return this;
  }

  withTwitterCard(type: 'summary' | 'summary_large_image'): this {
    this.tags.push(`
      <meta name="twitter:card" content="${type}" />
    `);
    return this;
  }

  withOEmbed(href: string): this {
    this.tags.push(`<link rel="alternate" type="application/json+oembed" href="${href}" />`);
    return this;
  }

  build(): string {
    const meta = this.tags.join('\n');
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" class="no-js" xmlns="http://www.w3.org/1999/xhtml">
<head>
${meta}
</head>
</html>`;
  }
}
