import jsPDF from 'jspdf';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { AnalysisResult } from '../types';

export function generateTxtContent(result: AnalysisResult): string {
  const divider = '='.repeat(70);
  const subDivider = '-'.repeat(70);

  return [
    divider,
    'AI TEXT DETECTIVE — FORENSIC STYLOMETRIC ANALYSIS REPORT',
    divider,
    `Date & Time:       ${new Date(result.analyzedAt).toLocaleString()}`,
    `Document Title:    ${result.title || 'Untitled Sample'}`,
    `Source Method:     ${result.source.toUpperCase()}`,
    `Word Count:        ${result.stats.wordCount} words`,
    `Sentence Count:    ${result.stats.sentenceCount} sentences`,
    `Avg Sentence Len:  ${result.stats.avgSentenceLength} words/sentence`,
    subDivider,
    `OVERALL ASSESSMENT: [ ${result.assessment.toUpperCase()} ]`,
    `Confidence Level:   ${result.confidenceLevel || 'Moderate'}`,
    subDivider,
    '',
    'EXECUTIVE SUMMARY:',
    result.summary,
    '',
    subDivider,
    'STYLOMETRIC DIMENSIONS EVALUATED:',
    `1. Sentence Rhythm & Burstiness:`,
    `   Rating: ${result.metrics.burstiness.rating}`,
    `   Notes:  ${result.metrics.burstiness.explanation}`,
    '',
    `2. Lexical Diversity & Perplexity:`,
    `   Rating: ${result.metrics.perplexityAndVocabulary.rating}`,
    `   Notes:  ${result.metrics.perplexityAndVocabulary.explanation}`,
    '',
    `3. Structural Symmetry & Repetitive Patterns:`,
    `   Rating: ${result.metrics.repetitiveStructures.rating}`,
    `   Notes:  ${result.metrics.repetitiveStructures.explanation}`,
    '',
    `4. Tone & Stylistic Neutrality:`,
    `   Rating: ${result.metrics.toneAndVoice.rating}`,
    `   Notes:  ${result.metrics.toneAndVoice.explanation}`,
    '',
    subDivider,
    'KEY OBSERVATIONS:',
    ...result.observations.map((obs, idx) => `[${idx + 1}] ${obs.category}: ${obs.detail}`),
    '',
    subDivider,
    'HIGHLIGHTED PATTERNS & PHRASES IDENTIFIED:',
    result.highlightedPhrases && result.highlightedPhrases.length > 0
      ? result.highlightedPhrases.map(p => `• "${p.phrase}" [${p.type.toUpperCase()}]: ${p.reason}`).join('\n')
      : '• No marked abnormal formulaic phrases detected.',
    '',
    subDivider,
    'EXTRACTED / ANALYZED PROSE SAMPLE:',
    result.originalText,
    '',
    divider,
    'LEGAL & SCIENTIFIC LIMITATION DISCLAIMER:',
    'Notice: AI writing detection relies on statistical stylometry, perplexity,',
    'and burstiness heuristics. These markers are probabilistic indicators and',
    'DO NOT constitute empirical or legal proof of authorship. Non-native English',
    'speakers, academic papers, and standardized technical manuals often trigger',
    'false positives. Conversely, lightly edited AI prose can produce false negatives.',
    'Always use human editorial judgment in conjunction with this software.',
    divider
  ].join('\n');
}

export async function downloadTxtReport(result: AnalysisResult): Promise<void> {
  const content = generateTxtContent(result);
  const filename = `AI-Text-Detective-Report-${Date.now()}.txt`;

  // On Native Android, trigger Share sheet if possible
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title: 'AI Text Detective Report',
        text: content,
        dialogTitle: 'Share Forensic Report'
      });
      return;
    } catch (e) {
      // Fallback to web download
    }
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildPdfDocument(result: AnalysisResult): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 75, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('AI TEXT DETECTIVE', margin, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Linguistic Stylometrics & Authorship Pattern Forensic Report', margin, 54);

  y = 95;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 54, 4, 4, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Timestamp: ${new Date(result.analyzedAt).toLocaleString()}`, margin + 14, y + 18);
  doc.text(`Source: ${result.source.toUpperCase()}`, margin + 14, y + 36);

  doc.text(`Word Count: ${result.stats.wordCount} words`, margin + 220, y + 18);
  doc.text(`Sentence Count: ${result.stats.sentenceCount}`, margin + 220, y + 36);

  doc.text(`Avg Sentence: ${result.stats.avgSentenceLength} words`, margin + 360, y + 18);
  doc.text(`Title: ${result.title.slice(0, 24)}`, margin + 360, y + 36);

  y += 68;

  // Assessment Banner
  let badgeFill = [241, 245, 249];
  let badgeStroke = [148, 163, 184];
  let badgeText = [51, 65, 85];

  if (result.assessment === 'Possibly AI-generated') {
    badgeFill = [254, 242, 242];
    badgeStroke = [248, 113, 113];
    badgeText = [153, 27, 27];
  } else if (result.assessment === 'Possibly human-written') {
    badgeFill = [240, 253, 244];
    badgeStroke = [74, 222, 128];
    badgeText = [22, 101, 52];
  } else {
    badgeFill = [248, 250, 252];
    badgeStroke = [203, 213, 225];
    badgeText = [71, 85, 105];
  }

  doc.setFillColor(badgeFill[0], badgeFill[1], badgeFill[2]);
  doc.setDrawColor(badgeStroke[0], badgeStroke[1], badgeStroke[2]);
  doc.roundedRect(margin, y, contentWidth, 44, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  doc.text(`ASSESSMENT: ${result.assessment.toUpperCase()}`, margin + 14, y + 26);

  y += 56;

  // Executive Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Executive Summary', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(result.summary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 12 + 16;

  // Stylometric Dimensions
  checkPageBreak(120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Evaluated Linguistic Dimensions', margin, y);
  y += 14;

  const metricsList = [
    { name: 'Sentence Rhythm & Burstiness', m: result.metrics.burstiness },
    { name: 'Vocabulary & Perplexity', m: result.metrics.perplexityAndVocabulary },
    { name: 'Structural Repetition & Symmetry', m: result.metrics.repetitiveStructures },
    { name: 'Tone & Voice Hedging', m: result.metrics.toneAndVoice }
  ];

  metricsList.forEach(({ name, m }) => {
    checkPageBreak(36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`• ${name}: `, margin + 6, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(79, 70, 229);
    doc.text(`[${m.rating}]`, margin + 160, y);
    y += 11;

    doc.setTextColor(71, 85, 105);
    const explLines = doc.splitTextToSize(m.explanation, contentWidth - 14);
    doc.text(explLines, margin + 14, y);
    y += explLines.length * 11 + 6;
  });

  y += 10;

  // Key Observations
  checkPageBreak(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Stylometric Observations', margin, y);
  y += 14;

  result.observations.forEach(obs => {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${obs.category}:`, margin + 6, y);
    y += 11;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(obs.detail, contentWidth - 14);
    doc.text(lines, margin + 14, y);
    y += lines.length * 11 + 6;
  });

  y += 12;

  // Text Sample Preview
  checkPageBreak(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Inspected Text Excerpt', margin, y);
  y += 14;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const samplePreview = result.originalText.length > 1200 
    ? result.originalText.slice(0, 1200) + '\n\n[... Text truncated for PDF report preview ...]'
    : result.originalText;

  const sampleLines = doc.splitTextToSize(samplePreview, contentWidth - 16);
  const boxHeight = sampleLines.length * 9.5 + 16;

  checkPageBreak(Math.min(boxHeight, 220));
  doc.roundedRect(margin, y, contentWidth, Math.min(boxHeight, 220), 4, 4, 'FD');
  doc.text(sampleLines.slice(0, 22), margin + 8, y + 14);
  y += Math.min(boxHeight, 220) + 16;

  // Mandatory Disclaimer
  checkPageBreak(70);
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, y, contentWidth, 54, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('CRITICAL LIMITATION DISCLAIMER', margin + 10, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  const discLines = doc.splitTextToSize(
    'AI authorship patterns are probabilistic stylometric observations, NOT empirical proof of machine generation. Human writing, particularly by non-native English speakers or standardized academic prose, may be mistakenly classified. Do not rely solely on automated detectors for punitive or academic integrity decisions.',
    contentWidth - 20
  );
  doc.text(discLines, margin + 10, y + 28);

  // Footer on all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `AI Text Detective — Page ${i} of ${totalPages} — Verified Forensic Assessment`,
      margin,
      pageHeight - 20
    );
  }

  return doc;
}

export async function downloadPdfReport(result: AnalysisResult): Promise<void> {
  const doc = buildPdfDocument(result);
  const filename = `AI-Text-Detective-Report-${Date.now()}.pdf`;

  // On Native Android, trigger Share Sheet if available
  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output('datauristring');
      await Share.share({
        title: 'AI Text Detective PDF Report',
        text: `Forensic Stylometric Assessment: ${result.assessment}`,
        url: dataUri,
        dialogTitle: 'Share PDF Report'
      });
      return;
    } catch (e) {
      // Fallback
    }
  }

  doc.save(filename);
}

export async function shareReportSheet(result: AnalysisResult): Promise<void> {
  const summaryText = `AI Text Detective Report\nDocument: ${result.title}\nAssessment: ${result.assessment}\nSummary: ${result.summary}\nDate: ${new Date(result.analyzedAt).toLocaleDateString()}`;

  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: 'AI Text Detective Report',
        text: summaryText,
        dialogTitle: 'Share Analysis Report'
      });
    } else if (navigator.share) {
      await navigator.share({
        title: 'AI Text Detective Report',
        text: summaryText
      });
    } else {
      await downloadTxtReport(result);
    }
  } catch (err) {
    console.warn('Share dismissed or unavailable:', err);
  }
}
