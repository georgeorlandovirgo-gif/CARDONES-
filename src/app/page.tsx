import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Droplets, Heart, Leaf, PackageCheck, Sparkles, Sun, Sprout, MapPin } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { FeaturedCollection } from "@/components/FeaturedCollection";
import { assetUrl } from "@/lib/asset-url";

export default function HomePage(){ return <>
  <section className="hero hero-campaign" style={{"--campaign-image": `url(${assetUrl("/images/cardones-collection-campaign.webp")})`, "--campaign-mobile-image": `url(${assetUrl("/images/cardones-mobile-campaign.webp")})`} as CSSProperties}>
    <div className="hero-campaign-picture" aria-hidden="true" />
    <div className="container campaign-layout">
      <div className="campaign-copy">
        <div className="campaign-eyebrow"><span className="tiny-diamond">✧</span> THE CARDONE’S BOTANICAL COLLECTION <span className="tiny-diamond">✧</span></div>
        <h1>Rooted in nature.<br/><em>Made for</em><br/>your ritual.</h1>
        <span className="campaign-rule"/>
        <p>Everyday botanical oils. Beautifully presented. Thoughtfully selected for your hair, skin, and moments of self-care.</p>
        <div className="campaign-actions"><Link href="/shop" className="button button-champagne">Explore the collection <ArrowUpRight size={17}/></Link><Link className="campaign-secondary" href="/about">The Cardone’s story <ArrowRight size={17}/></Link></div>
        <div className="campaign-origin"><MapPin size={15}/> PACKAGED IN ST. ELIZABETH, JAMAICA</div>
      </div>
      <div className="campaign-photo-credit">ILLUSTRATIVE COLLECTION PRESENTATION</div>
    </div>
    <div className="campaign-border"/>
  </section>

  <section className="luxury-pillars" aria-label="The Cardone’s difference"><div className="container pillars-inner">
    <div><span className="pillar-icon"><Leaf size={25} strokeWidth={1.3}/></span><p><strong>BOTANICAL BEAUTY</strong><small>Simple oils for considered care</small></p></div>
    <div><span className="pillar-icon"><MapPin size={25} strokeWidth={1.3}/></span><p><strong>JAMAICAN ROOTS</strong><small>Packaged in St. Elizabeth</small></p></div>
    <div><span className="pillar-icon"><PackageCheck size={25} strokeWidth={1.3}/></span><p><strong>THOUGHTFULLY PRESENTED</strong><small>Signature glass-bottle collection</small></p></div>
    <div><span className="pillar-icon"><Heart size={25} strokeWidth={1.3}/></span><p><strong>A PERSONAL TOUCH</strong><small>A family business, with gratitude</small></p></div>
  </div></section>

  <section className="section collection-section editorial-collection" id="collection"><div className="container">
    <div className="collection-intro"><span className="eyebrow luxe-eyebrow">DISCOVER THE COLLECTION / 01</span><div className="collection-intro-grid"><h2>Nature’s details.<br/><em>Beautifully bottled.</em></h2><div><p>From richly conditioning castor oil to lightweight golden jojoba, discover a collection designed around your everyday hair and skin rituals.</p><Link href="/shop" className="underlined-link">VIEW ALL PRODUCTS <ArrowUpRight size={17}/></Link></div></div></div>
    <FeaturedCollection/>
  </div></section>

  <section className="ritual-note"><div className="container ritual-note-inner"><span className="ritual-emblem">✦</span><div><span className="eyebrow">THE ART OF THE EVERYDAY</span><h2>A little care becomes<br/><em>a beautiful ritual.</em></h2></div><p>There is beauty in familiar things. The warmth of golden oil, the simplicity of a daily routine, and products chosen with you in mind.</p></div></section>

  <section className="section ritual-edit"><div className="container ritual-edit-grid">
     <div className="ritual-edit-media"><div className="ritual-edit-halo"/><Image src={assetUrl("/images/olive-bottle.webp")} alt="Cardone’s Extra Virgin Olive Oil presented in its gold-labelled amber glass bottle" fill sizes="(max-width: 800px) 84vw, 520px"/><span className="ritual-edit-caption">A TOUCH OF GOLD, AN EVERYDAY MOMENT</span></div>
     <div className="ritual-edit-text"><span className="eyebrow">BOTANICAL RITUALS / 02</span><span className="ornamental-line"/><h2>Care, in its<br/><em>most considered</em><br/>form.</h2><p>Our collection brings together familiar, versatile botanical oils in a distinctive gold-labelled presentation—because the little details should feel special, too.</p><div className="ritual-list"><span><Droplets size={18}/> HAIR & SCALP CARE</span><span><Sprout size={18}/> SKIN & BODY RITUALS</span><span><Sun size={18}/> EVERYDAY SELF-CARE</span></div><Link href="/shop" className="button button-outline-dark">FIND YOUR OIL <ArrowUpRight size={18}/></Link></div>
  </div></section>

  <section className="editorial-lifestyle"><div className="editorial-lifestyle-photo" style={{backgroundImage: "url(" + assetUrl("/images/cardones-lifestyle-hair.webp") + ")"}} role="img" aria-label="Illustrative Jamaican-inspired hair-care moment with natural curls and warm Caribbean light"/><div className="lifestyle-story-copy"><span className="eyebrow">AN EVERYDAY RITUAL / 03</span><span className="ornamental-line"/><h2>Time for your hair.<br/><em>A moment for you.</em></h2><p>From gentle scalp massage to conditioning dry lengths, the Cardone’s collection belongs in the small daily routines that make you feel cared for.</p><Link href="/shop" className="button button-outline-dark">EXPLORE HAIR CARE <ArrowUpRight size={17}/></Link><small>Imagery is an artistic representation, not a verified product treatment result.</small></div></section>

  <section className="cardones-still-life">
    <div className="cardones-still-image"><Image src={assetUrl("/images/cardones-oil-detail.webp")} alt="Illustrative golden oil droplet, glass and travertine detail" fill sizes="(max-width: 760px) 100vw, 55vw"/></div>
    <div className="cardones-still-copy"><span className="eyebrow">THE BEAUTY OF A RITUAL</span><h2>Beauty in <em>the little details.</em></h2><p>Slow down and make room for everyday care. Discover the simple pleasure of botanical oils, presented with a distinctly Jamaican sense of warmth.</p><Link href="/shop" className="button button-outline-dark">EXPLORE OUR OILS <ArrowUpRight size={17}/></Link><small>Illustrative oil study. Accessories shown are not included with products.</small></div>
  </section>
  <section className="founders-band"><div className="container founders-band-inner"><div className="founders-mark">C<span>✧</span></div><div><span className="eyebrow">MADE WITH YOU IN MIND</span><h2>A family business.<br/><em>A signature of care.</em></h2><p>Thank you for choosing Cardone’s Products. Our Jamaican roots and thoughtful presentation are at the heart of this growing botanical collection.</p><Link href="/about" className="underlined-link founders-link">OUR STORY <ArrowUpRight size={17}/></Link></div></div></section>

  <section className="section closing-collection"><div className="container closing-inner"><div><span className="eyebrow">YOUR RITUAL STARTS HERE</span><h2>Find something<br/><em>beautiful for you.</em></h2><p>Explore the entire Cardone’s oil collection, including new arrivals and products coming soon.</p></div><Link href="/shop" className="button button-champagne">SHOP THE COLLECTION <ArrowUpRight size={17}/></Link></div></section>
  </>;
}