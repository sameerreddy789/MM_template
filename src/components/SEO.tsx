import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = "MohanaMantra 2K26 | MBU Cultural & Technical Fest",
  description = "Official website of MohanaMantra 2K26 at Mohan Babu University (MBU). Join India's premier national level techno-cultural fest celebrating art, music, dance, code, and innovation.",
  keywords = "mohanamantra, MohanaMantra, mohanamantra 2k26, mbu, mohan babu university, college fest, mohanamantra 2026, cultural fest mbu",
  canonicalUrl = "https://mm-template.vercel.app/",
  ogImage = "https://mm-template.vercel.app/images/logo.webp",
  ogType = "website",
}) => {
  return (
    <Helmet>
      {/* Title & Basics */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="MohanaMantra 2K26 | MBU" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:url" content={canonicalUrl} />
    </Helmet>
  );
};

export default SEO;
