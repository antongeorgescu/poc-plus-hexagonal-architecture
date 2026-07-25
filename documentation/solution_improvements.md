Searched for files matching `**/*.pptx`, 1 match

Ran terminal command: 
$pptxPath = "c:\Users\ag4488\OneDrive - Finastra\Architecture\September-Architecture-Summit\From BLL to PLL\From BLL to PLL - A Paradigm Shift.pptx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($pptxPath)
$slideEntries = $zip.Entries | Where-Object { $_.FullName -match "ppt/slides/slide\d+\.xml" } | Sort-Object { [int]($_.FullName -replace '\D','') }
foreach ($entry in $slideEntries) {
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = $reader.ReadToEnd()
    $reader.Close()
    # Extract text nodes
    $text = [regex]::Matches($xml, '<a:t[^>]*>([^<]+)</a:t>') | ForEach-Object { $_.Groups[1].Value }
    Write-Output "=== $($entry.FullName) ==="
    $text -join ' '
    Write-Output ""
}
$zip.Dispose()


Ran terminal command: 
Add-Type -Assembly System.IO.Compression.FileSystem
$pptxPath = "c:\Users\ag4488\OneDrive - Finastra\Architecture\September-Architecture-Summit\From BLL to PLL\From BLL to PLL - A Paradigm Shift.pptx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($pptxPath)
$entries = $zip.Entries | Select-Object FullName
$entries | Format-Table -AutoSize
$zip.Dispose()


Ran terminal command: Test-Path "c:\Users\ag4488\OneDrive - Finastra\Architecture\September-Architecture-Summit\From BLL to PLL\From BLL to PLL - A Paradigm Shift.pptx"

Ran terminal command: $p = "c:\Users\ag4488\OneDrive - Finastra\Architecture\September-Architecture-Summit\From BLL to PLL\From BLL to PLL - A Paradigm Shift.pptx"; Add-Type -Assembly "System.IO.Compression.FileSystem"; $z = [System.IO.Compression.ZipFile]::OpenRead($p); $z.Entries | Select-Object -First 20 | ForEach-Object { $_.FullName }; $z.Dispose()

Ran terminal command: $p = "c:\Users\ag4488\OneDrive - Finastra\Architecture\September-Architecture-Summit\From BLL to PLL\From BLL to PLL - A Paradigm Shift.pptx"
Add-Type -Assembly "System.IO.Compression.FileSystem"
$z = [System.IO.Compression.ZipFile]::OpenRead($p)
$slides = $z.Entries | Where-Object { $_.FullName -match "^ppt/slides/slide\d+\.xml$" } | Sort-Object { [regex]::Match($_.FullName, '\d+').Value -as [int] }
foreach ($s in $slides) {
    $sr = New-Object System.IO.StreamReader($s.Open())
    $content = $sr.ReadToEnd()
    $sr.Dispose()
    $texts = [regex]::Matches($content, '(?<=<a:t>|<a:t [^>]*>)(.*?)(?=</a:t>)') | ForEach-Object { $_.Value }
    if ($texts) {
        Write-Host "--- $($s.FullName) ---"
        $texts | ForEach-Object { Write-Host $_ }
    }
}
$z.Dispose()

Ran terminal command: python -c "
import zipfile, re, sys
p = r'c:\Users\ag4488\OneDrive - Finastra\Architecture\September-Architecture-Summit\From BLL to PLL\From BLL to PLL - A Paradigm Shift.pptx'
with zipfile.ZipFile(p) as z:
    slides = sorted([n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml', n)], key=lambda x: int(re.search(r'\d+', x).group()))
    for s in slides:
        content = z.read(s).decode('utf-8')
        texts = re.findall(r'<a:t[^>]*>([^<]+)</a:t>', content)
        if texts:
            print(f'\n=== {s} ===')
            print(' | '.join(texts))
"


Now I have the full content. Let me analyze it thoroughly.

---

## Presentation Analysis: "From BLL to PLL – A Paradigm Shift"

---

### Suggested Title
**"Beyond Deterministic Logic: Rethinking N-Tier Architecture for the Age of Agentic AI"**

---

### 3-Liner Summary

Traditional N-tier applications are anchored by a deterministic Business Logic Layer (BLL) — structured, rule-based code where use cases dictate every "if-else" path at design time. This presentation introduces a new architectural paradigm where an AI-driven layer replaces or complements the BLL with context-aware, adaptive orchestration powered by large language models and agentic workflows. The shift demands evolved SDLC practices — including prompt engineering and agent orchestration strategies — and formally introduces an "AI Expert" role spanning product analysis, architecture, development, and QA.

---

### Terminology: Is "PLL / Prompt Logic Layer" the Right Term?

**Short answer: No — it's a reasonable first-cut but has meaningful weaknesses.**

#### Problems with "PLL / Prompt Logic Layer"
1. **Internal inconsistency**: The deck itself alternates between *"AI-Driven Prompt Logic Layer"* (slide 7 header) and *"AI-Prompt Driven Logic Layer"* (slide 7 body). Fixing this alone would help.
2. **"Prompt" is mechanism, not concept**: "Prompt" describes *how* you talk to an LLM, not *what the layer does*. As systems mature toward multi-step reasoning, tool-calling, and agent-to-agent coordination, the term feels anchored to today's primitive interaction model.
3. **"PLL" is already taken**: In electronics and telecom, PLL stands for *Phase-Locked Loop* — a widely recognized acronym. Worth avoiding in cross-domain enterprise contexts.
4. **Not futures-proof**: The industry is rapidly moving from *prompting* to *agentic* patterns (AutoGen, Semantic Kernel, LangGraph). "Prompt" will likely feel dated within 2–3 years.

---

### Better Alternatives (with rationale)

| Term | Acronym | Why it works |
|---|---|---|
| **Agentic Orchestration Layer** | AOL | Aligns with Microsoft Semantic Kernel, LangChain, AutoGen language — industry standard for multi-step AI coordination |
| **Cognitive Logic Layer** | CLL | Mirrors the existing "LL" naming convention of BLL/DLL; "Cognitive" directly contrasts with "deterministic" — very clean conceptual opposition |
| **AI Reasoning Layer** | ARL | "Reasoning" captures chain-of-thought, inference, and tool-use — more durable than "prompt" |
| **Agentic Logic Layer** | ALL | Keeps the "Logic Layer" convention from BLL; "Agentic" is the dominant 2025–2026 industry term |
| **Non-Deterministic Logic Layer** | NDLL | Technically precise — directly contrasts with the deterministic BLL; academic-friendly |

**Top recommendation: `CLL – Cognitive Logic Layer`**

It keeps your naming convention (`BLL → CLL`), the contrast is immediately legible (*deterministic* logic vs. *cognitive* logic), and "cognitive" is futures-proof regardless of whether the underlying mechanism is prompting, reasoning, or multi-agent orchestration.

---

### Other Improvement Suggestions

- **Slide 4 / 7 symmetry is strong** — but the right-column roles on slide 7 don't explicitly call out which roles are *new* vs. *evolved*. A delta-view (old role → new responsibility) would sharpen the "paradigm shift" message.
- **Slide 10 use cases** are tied to a specific student lending example. A one-liner generalizing each use case pattern (e.g., UC4 = *"contextual case creation"*) would make the slide reusable for broader audiences.
- **Slide 11 (Scribe Agent appendix)** is orphaned — it's never referenced in the main narrative. Either wire it to UC4 explicitly, or promote it into the body of the deck as a concrete agentic pattern example.
- **Missing slide**: There's no slide contrasting *when to use BLL vs. CLL* (i.e., not everything should be AI-driven). Adding a decision framework would strengthen architectural credibility.