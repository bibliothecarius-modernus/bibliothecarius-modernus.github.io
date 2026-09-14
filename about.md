---
layout: page
title: About
permalink: /about/
---

<div class="about-page">
  <img src="{{ '/assets/images/bibliothecarius-logo.png' | relative_url }}" alt="The Modern Librarian" class="profile">

  <h2>About Bibliothecarius Modernus</h2>

  <p>Bibliothecarius Modernus is an independent digital library of neglected Latin literature. It exists because a large part of the Latin Christian and medieval record — sermons, letters, treatises, commentaries, chronicles, dialogues — has never been translated into English, or was translated once, long ago, in an edition no library near you holds. The library's purpose is to put those works in front of readers, researchers, students and librarians in a form they can read, hear, verify and cite: complete open translations, parallel texts, contextual research, audio and video editions, and machine-readable scholarly data — and, where the sources require it, new transcriptions from manuscripts.</p>

  <h3>What an edition contains</h3>

  <p>The unit of the library is the <strong>edition</strong>: one complete publication of one work. An edition contains the English translation with the Latin source alongside it, segment by segment, so that every sentence can be checked; a researched introduction with its bibliography; an audio edition on the Internet Archive; an archival video on YouTube, in which the Latin is on screen while the English is read; the edition's data (<code>translation.json</code>) in the open text corpus on GitHub; and a page on this site, the <em>Resource Info</em> tab of which records the catalog id, the source location, the method, the review status and the rights. Editions are identified by the library's catalog ids (<code>plNNN-SSS</code>: Patrologia Latina volume and sequence) and, for the newer editions, by passage locators that pin a sentence to a column and a segment.</p>

  <h3>Completeness and installments</h3>

  <p>When a work is selected, the whole work is the goal — never an excerpt or a "best of". Long works are published in installments that follow the work's own divisions (books, letters, sermons, chapters), never a word count, and each installment states where it sits in the whole. The library grows in two ways: broad, partly serendipitous coverage of neglected printed Latin literature (Migne's <em>Patrologia Latina</em> and related editions), and, in future, deliberately selected manuscript material that has never been transcribed.</p>

  <h3>How the editions are made and checked</h3>

  <p>Modern AI makes a one-person library of this scale possible, and the library does not hide that; it describes the method, per edition, from recorded provenance. For editions made since September 2026 the workflow is this. The Latin is taken from the source with its boundaries read and confirmed by the curator and its <strong>source integrity</strong> recorded (source kind, volume and columns, complications such as misprinted references). The text is translated in short, source-anchored segments by a production model chosen after a whole-work comparison of candidates; the model is named on the edition page, not here, because models change. Every segment is then checked deterministically against the Latin for <strong>coverage</strong>, so that no stretch of the source can be silently dropped. The translation is submitted to an independent <strong>cross-family review</strong> by a model of a different family, which reports concrete errors tied to exact Latin; the curator reads the flagged passages against the Latin, decides each item, and applies corrections only through a corrections file, so that every change is <strong>recorded</strong> with its Latin basis, its reason and who judged it. Contextual research is produced with a web-search-augmented research model, read by the curator against the cited sources, and kept as a <strong>verified claims record</strong> from which the introduction, the video description and the metadata are derived — a claim the record does not support cannot be published. Narration uses a synthetic voice; the audio and subtitles are checked against the text.</p>

  <p>Each edition therefore states its <strong>provenance</strong>: which models and checks were used, when, and what its <strong>review status</strong> is. The statuses are: <em>coverage-verified</em> (every stretch of the Latin is accounted for in the English and, for the newer editions, an independent review and the curator's corrections are recorded), <em>human-reviewed</em> (the curator read the whole translation against the Latin), <em>spot-checked</em>, <em>defect-recorded</em> (a known defect is listed rather than hidden) and <em>unreviewed</em>. A review status is a statement of what was checked. <strong>It is not a guarantee of perfect fidelity</strong>: errors remain possible in every edition, and the Latin is always beside the English so that you can check.</p>

  <h3>What these editions are not</h3>

  <p>These are not critical editions, but they are documented, source-linked digital editions with explicit provenance and review status. They are reliable enough to read, to quote with care against the Latin, and to use as the starting point for a scholarly translation — which anyone may do without asking.</p>

  <h3>The historical corpus (2024–2025)</h3>

  <p>Most of the library's editions were made before the current workflow existed, with earlier models and lighter checks: no segment-level coverage check, no independent review, and no per-segment provenance. Their pages say so (review status <em>unreviewed</em> or <em>defect-recorded</em>), and the twelve editions known to be missing a contiguous stretch of their source are flagged in the machine-readable catalog. They are preserved rather than rewritten, repaired individually when a real defect is found, and never presented as more than they are.</p>

  <h3>Manuscripts</h3>

  <p>Where a neglected work survives only in manuscript, or where no usable printed text exists, the library will transcribe it from digitized images held by libraries and museums. Each such transcription will be published with full provenance — holding institution, shelfmark and folios, the images used and their rights, the transcription method, its review status and its version — will credit the holding institution first and fully, and will be dedicated to the public domain like everything else the library creates. The manuscript images themselves remain under the terms of the institution that holds them.</p>

  <h3>Licensing</h3>

  <p>Translations, introductions, metadata and transcriptions created by Bibliothecarius Modernus are dedicated to the public domain (<a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank">CC0 1.0</a>). The Latin sources are public domain (Migne, <em>Patrologia Latina</em>, 1844–65, or the named manuscript). Figures reproduced from third parties carry their own rights, stated where they appear. Methodology papers and system documentation are CC BY 4.0; software is MIT. If you want to credit the library or just let me know this was helpful, that is always appreciated but never required. Details: <a href="{{ '/LICENSE.md' | relative_url }}">Licensing</a>.</p>

  <h3>Where the library lives</h3>

  <ul class="resource-list">
    <li><a href="{{ '/' | relative_url }}">This site</a> — the reading room: parallel texts, introductions, bibliographies, figures, resource identity, search in Latin and English.</li>
    <li><a href="{{ site.youtube_username | prepend: 'https://youtube.com/@' }}" target="_blank">YouTube</a> — the archival video editions (the Latin on screen, the English read aloud).</li>
    <li><a href="https://github.com/wryan14/Latin-Patristic-Texts" target="_blank">Latin Patristic Texts</a> — the open text corpus: Latin source, English translation and edition data for every work, cloneable and versioned.</li>
    <li><a href="{{ site.archive_link }}" target="_blank">Internet Archive</a> — the audio editions and edition data, preserved.</li>
    <li><a href="{{ '/api/README.md' | relative_url }}">Machine-readable catalog</a> — every work the library indexes and every edition with identifiers, source location, provenance, review status and rights, for software and citation tools.</li>
    <li><a href="https://doi.org/10.5281/zenodo.18002473" target="_blank">White paper (December 2025)</a> — the project's philosophy, architecture and methodology as they stood then; a second, evidence-based paper is being written from the project's own records.</li>
  </ul>

  <hr style="width: 70%; margin: 30px auto; border: none; border-top: 1px solid #c0b283;">

  <!-- About the curator -->
  <h3>About the curator</h3>

  <div class="about-me">
    <div class="circular-photo-container">
      <img src="{{ '/assets/images/ryan-photo.jpg' | relative_url }}" alt="Ryan Wolfslayer" class="profile">
    </div>

    <p>Bibliothecarius Modernus is built and curated by Ryan Wolfslayer, a librarian (MSLIS, University of Illinois at Urbana-Champaign) who has spent close to a decade working in digital librarianship, metadata and scholarly infrastructure, and who programs in Python. The library is the natural work of that training: collection development, cataloguing and stable identifiers, provenance, rights, preservation, and interoperability with the repositories and tools that researchers actually use. The interest in the texts themselves is personal — years of reading theology and church history — and the library is an independent project.</p>
    <p>ORCID: <a href="https://orcid.org/0000-0001-8914-9706" target="_blank">0000-0001-8914-9706</a></p>
  </div>

  <!-- Connect Section (consolidated) -->
  <h3>Connect & Contribute</h3>
  
  <p>Corrections, references to existing translations or editions, and requests for works are welcome. If you know of a scholarly translation of a work published here, please say so; the edition page will point to it.</p>
  
  <div class="contact-methods">
    <p>
      <strong>Contact:</strong> <a href="mailto:bibliothecarius.modernus@gmail.com">bibliothecarius.modernus@gmail.com</a><br>
      <strong>Professional:</strong> <a href="https://www.linkedin.com/in/ryanwolfslayer/" target="_blank">LinkedIn</a>
    </p>
  </div>
  
  <div class="social-links">
    <a href="{{ site.youtube_username | prepend: 'https://youtube.com/@' }}" target="_blank">
      <svg class="svg-icon youtube">
        <path fill="currentColor" d="M23,9.71a8.5,8.5,0,0,0-.91-4.13,2.92,2.92,0,0,0-1.72-1A78.36,78.36,0,0,0,12,4.27a78.45,78.45,0,0,0-8.34,.3,2.93,2.93,0,0,0-1.73,1A8.35,8.35,0,0,0,1,9.71a48.29,48.29,0,0,0,0,4.58,8.33,8.33,0,0,0,.92,4.13A3.09,3.09,0,0,0,3.66,19.5a78.24,78.24,0,0,0,8.34,.31,78.24,78.24,0,0,0,8.34-.31,3,3,0,0,0,1.73-1.07,8.32,8.32,0,0,0,.91-4.13,48.29,48.29,0,0,0,0-4.58ZM9.88,14.56V9.44l5.47,2.55Z"/>
      </svg>
      YouTube
    </a>
    <a href="{{ site.github_username | prepend: 'https://github.com/' }}" target="_blank">
      <svg class="svg-icon github">
        <path fill="currentColor" d="M12,2.2467A10.00042,10.00042,0,0,0,8.83752,21.73419c.5.08752.6875-.21247.6875-.475,0-.23749-.01251-1.025-.01251-1.86249C7,19.85919,6.35,18.78423,6.15,18.22173A3.636,3.636,0,0,0,5.125,16.8092c-.35-.1875-.85-.65-.01251-.66248A2.00117,2.00117,0,0,1,6.65,17.17169a2.13742,2.13742,0,0,0,2.91248.825A2.10376,2.10376,0,0,1,10.2,16.65923c-2.225-.25-4.55-1.11254-4.55-4.9375a3.89187,3.89187,0,0,1,1.025-2.6875,3.59373,3.59373,0,0,1,.1-2.65s.83747-.26251,2.75,1.025a9.42747,9.42747,0,0,1,5,0c1.91248-1.3,2.75-1.025,2.75-1.025a3.59323,3.59323,0,0,1,.1,2.65,3.869,3.869,0,0,1,1.025,2.6875c0,3.83747-2.33752,4.6875-4.5625,4.9375a2.36814,2.36814,0,0,1,.675,1.85c0,1.33752-.01251,2.41248-.01251,2.75,0,.26251.1875.575.6875.475A10.0053,10.0053,0,0,0,12,2.2467Z"/>
      </svg>
      GitHub
    </a>
    <a href="{{ site.archive_link }}" target="_blank">
      <svg class="svg-icon archive">
        <path fill="currentColor" d="M21,3H3A2,2,0,0,0,1,5V19a2,2,0,0,0,2,2H21a2,2,0,0,0,2-2V5A2,2,0,0,0,21,3ZM4,19V17H20v2ZM20,15H4V5H20Z"/>
        <rect fill="currentColor" x="6" y="7" width="12" height="2"/>
        <rect fill="currentColor" x="6" y="11" width="12" height="2"/>
      </svg>
      Internet Archive
    </a>
  </div>
</div>