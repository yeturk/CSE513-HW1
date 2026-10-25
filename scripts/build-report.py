"""Build a local submission draft. Personal metadata lives in ignored .submission/."""
import json
import argparse
import reportlab
from pathlib import Path
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--data', type=Path, default=ROOT / 'output/report-data/results.json')
args = parser.parse_args()
if not args.data.is_file():
    parser.error('Report data is missing. Run node scripts/export-report-data.mjs first.')
data = json.loads(args.data.read_text(encoding='utf-8'))
# Refuse stale/unverified additional data, even when invoked separately from the exporter.
if sorted(example['id'] for example in data['additional']) != ['idle', 'preemption', 'ties']:
    parser.error('Expected the idle, ties and preemption report references. Re-run the exporter.')
for example in data['additional']:
    if example.get('comparison') != 'Exact match' or 'expected' not in example:
        parser.error('Additional references are unverified. Re-run node scripts/export-report-data.mjs.')
    for key in ['segments', 'processes', 'averages']:
        if example['result'][key] != example['expected'][key]:
            parser.error(f"Additional reference {example['id']}: {key} mismatch. Re-run the exporter.")
meta_path = ROOT / '.submission/metadata.json'
meta = json.loads(meta_path.read_text(encoding='utf-8')) if meta_path.exists() else {}
website = meta.get('website', '')
repo = 'https://github.com/yeturk/CSE513-HW1'
out = ROOT / 'output/pdf'
out.mkdir(parents=True, exist_ok=True)
font_dir = Path(reportlab.__file__).resolve().parent / 'fonts'
pdfmetrics.registerFont(TTFont('Report', str(font_dir / 'Vera.ttf')))
pdfmetrics.registerFont(TTFont('ReportBold', str(font_dir / 'VeraBd.ttf')))
pdfmetrics.registerFontFamily('Report', normal='Report', bold='ReportBold', italic='Report', boldItalic='ReportBold')
styles = getSampleStyleSheet()
for name in ['Normal','BodyText','Heading1','Heading2','Heading3','Title']:
    styles[name].fontName = 'ReportBold' if name.startswith('Heading') or name == 'Title' else 'Report'
styles['BodyText'].fontSize = 9.5
styles['BodyText'].leading = 13
styles['BodyText'].spaceAfter = 6
styles['Heading1'].fontSize = 20
styles['Heading1'].leading = 25
styles['Heading1'].textColor = colors.HexColor('#172943')
styles['Heading2'].fontSize = 13
styles['Heading2'].leading = 18
styles['Heading2'].spaceBefore = 12
styles['Heading2'].spaceAfter = 7
styles['Heading3'].fontSize = 10.5
styles['Heading3'].leading = 15
styles.add(ParagraphStyle('SmallReport', parent=styles['BodyText'], fontSize=8, leading=11))
styles.add(ParagraphStyle('TableHead', fontName='ReportBold', fontSize=8, leading=10, textColor=colors.white))
styles.add(ParagraphStyle('TableCell', fontName='Report', fontSize=8.5, leading=11))
styles.add(ParagraphStyle('Draft', fontName='ReportBold', fontSize=10, leading=14, textColor=colors.HexColor('#a33a26'), spaceAfter=10))
story = []
def p(text, style='BodyText'):
    return Paragraph(text, styles[style])
def add(text, style='BodyText'):
    story.append(p(text, style))
def table(headers, rows, widths=None):
    cells = [[p(str(h), 'TableHead') for h in headers]] + [[p(escape(str(c)), 'TableCell') for c in row] for row in rows]
    t = Table(cells, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#263e61')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
        ('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#f0f4f9'),colors.white]),
        ('LINEBELOW',(0,0),(-1,-1),.4,colors.HexColor('#d8e1ed')),
    ]))
    story.append(t)
    story.append(Spacer(1,8))
def fmt(n): return f'{n:g}'
def metric_rows(processes):
    return [[x['id']] + [x[k] for k in ['arrival','burst','firstStart','completion','turnaround','waiting','response']] for x in processes]
metric_head = ['Process','Arrival','Burst','First start','Completion','Turnaround','Waiting','Response']
metric_widths = [53,49,41,57,69,67,56,63]
palette = ['#f4c65b','#78d5c1','#baa7f3','#f6a58f','#96c9f3']

class Gantt(Flowable):
    def __init__(self, segments, ids):
        super().__init__(); self.segments = segments; self.ids = ids; self.width = 495; self.height = 62
    def draw(self):
        c = self.canv; end = self.segments[-1]['end']; left = 0
        for s in self.segments:
            x = s['start']/end*self.width; w = (s['end']-s['start'])/end*self.width
            color = '#dce3ec' if s['processId'] is None else palette[self.ids.index(s['processId']) % len(palette)]
            c.setFillColor(colors.HexColor(color)); c.setStrokeColor(colors.white); c.rect(x,24,w,29,fill=1,stroke=1)
            c.setFillColor(colors.HexColor('#172943')); c.setFont('ReportBold',8)
            c.drawCentredString(x+w/2,35,s['processId'] or 'Idle')
            c.setFont('Report',8); c.drawString(x,12,str(s['start']))
        c.drawRightString(self.width,12,str(end))

def footer(canvas, doc):
    canvas.setFont('Report',8); canvas.setFillColor(colors.HexColor('#59677c'))
    canvas.drawString(50,28,'CSE513 Assignment 1 | Review draft')
    canvas.drawRightString(A4[0]-50,28,str(doc.page))

add('CSE513 Assignment 1<br/>CPU Scheduling Simulator', 'Heading1')
if website:
    add(f'Working website: <link href="{escape(website, quote=True)}" color="#244bd8">{escape(website)}</link>')
else:
    add('Working website: pending deployment - this draft is not ready to submit.', 'Draft')
add(f'Source repository: <link href="{repo}" color="#244bd8">{repo}</link> (dev branch)')
add('Student: ' + escape(meta.get('name', 'To be completed')) + '<br/>Student number: ' + escape(meta.get('studentNumber', 'To be completed')))
add('Review draft: read and confirm the explanations and AI-use statement before submission. Check the website link and student details above.', 'Draft')
add('1. Scope and model', 'Heading2')
add('Scheduling Lab is a browser-based React and TypeScript simulator for FCFS, non-preemptive SJF, preemptive SRTF, and Round Robin. The model has one CPU, one burst per process, no I/O, and zero context-switch cost. Simulated time is not wall-clock time; this is not an implementation of Ubuntu\'s scheduler.')
add('The interface supports process creation, editing and removal, a configurable RR quantum, automatic calculation, labeled Gantt intervals including idle time, complete per-process metrics, and comparison of the four algorithms. Workloads A/B and four learning presets are available. A first-use guide, light/dark themes, zoom, decision tracing and browser-local named workloads support exploration.')
add('2. Rules and calculations', 'Heading2')
table(['Policy','Selection rule'],[
    ['FCFS','Earliest arriving ready process; run to completion.'],
    ['SJF','Shortest burst among ready processes when the CPU becomes free.'],
    ['SRTF','Shortest remaining time. Preempt only for a strictly shorter remainder; keep the current process on a tie.'],
    ['RR','FIFO queue. At a boundary, admit new arrivals before re-enqueuing the unfinished runner. Completed jobs never rejoin.'],
], [62,433])
add('Selection ties use earlier arrival, then earlier input-list position. A ready process must run whenever one exists. If none is ready, the timeline includes an idle interval. An interval [s,e) supplies e-s CPU units. Consecutive RR quanta remain separate, even for the same process.')
add('<b>T = C - arrival; W = T - burst; R = S - arrival.</b><br/>S is first start; C is completion. Averages are arithmetic means over processes, and only displayed averages are rounded.')
add('3. Verification approach', 'Heading2')
add('The eight A/B schedules on the following pages were worked through with the student before implementation and preserved in docs/hand-calculations.md. The report exporter reads those prior calculations independently of the simulator, runs the current motor, and asserts equality of every interval and every process metric. The report contains both sets of values; none of the manual reference values is generated by simulate().')

reasons = {
 ('A','FCFS'): 'P1 starts alone at t=0 and is not interrupted. P2, P3 and P4 wait in arrival order.',
 ('A','SJF'): 'At t=0 only P1 is ready. At t=8, the ready bursts are P4=1, P3=2 and P2=4, so they run in that order.',
 ('A','SRTF'): 'At t=1, P2=4 is shorter than P1 remaining=7. At t=2, P3=2 is shorter than P2 remaining=3. P3 completes at t=4; P4 then runs without preempting a running job.',
 ('A','RR'): 'At t=2 the FIFO queue is P2,P3,P1. At t=4 it is P3,P1,P4,P2: P4 joins before unfinished P2. The final two P1 quanta remain distinct.',
 ('B','FCFS'): 'The CPU is idle before t=2. P1 wins the simultaneous-arrival tie by input order. Both early jobs finish by t=6; the next arrival is t=8.',
 ('B','SJF'): 'At t=2, P2 has a shorter burst than P1. At t=9, the arriving P4 cannot interrupt the non-preemptive P3.',
 ('B','SRTF'): 'The schedule equals SJF. At t=9 P3 has 1 unit remaining and P4 needs 1 unit. Equal remaining time keeps P3 running.',
 ('B','RR'): 'P1 runs from 2 to 4, then waits behind P2. It finishes from 5 to 6. The arrival of P4 at t=9 does not interrupt the current P3 quantum.',
}
for i,e in enumerate(data['examples'],1):
    story.append(PageBreak())
    title = f"{i}. Workload {e['workload']} / {e['algorithm']}" + (' (q = 2)' if e['algorithm']=='RR' else '')
    add(title, 'Heading1')
    add('Input data', 'Heading2')
    table(['Process','Arrival','CPU burst'], [[p['id'],p['arrival'],p['burst']] for p in e['input']], [165]*3)
    add('Hand-calculated schedule and metrics', 'Heading2')
    add(reasons[(e['workload'],e['algorithm'])])
    story.append(Gantt(e['manual']['segments'],[p['id'] for p in e['input']]))
    table(metric_head,metric_rows(e['manual']['processes']),metric_widths)
    av = e['manual']['averages']
    add(f"Hand averages: turnaround <b>{fmt(av['turnaround'])}</b>, waiting <b>{fmt(av['waiting'])}</b>, response <b>{fmt(av['response'])}</b>.")
    example = e['manual']['processes'][1]
    add(f"Worked metric calculation ({example['id']}): T = {example['completion']} - {example['arrival']} = {example['turnaround']}; W = {example['turnaround']} - {example['burst']} = {example['waiting']}; R = {example['firstStart']} - {example['arrival']} = {example['response']}.", 'SmallReport')
    add('Current simulator output', 'Heading2')
    table(metric_head,metric_rows(e['actual']['processes']),metric_widths)
    chart = ', '.join(f"{s['processId'] or 'Idle'} [{s['start']},{s['end']})" for s in e['actual']['segments'])
    add('Simulator timeline: '+chart+'.', 'SmallReport')
    actual_av = e['actual']['averages']
    add(f"Simulator averages: T={fmt(actual_av['turnaround'])}; W={fmt(actual_av['waiting'])}; R={fmt(actual_av['response'])}.")
    add('<b>Comparison:</b> Every timeline interval, first start, completion, turnaround, waiting, response and average matches the prior hand calculation. No discrepancy remains for this example.')

story.append(PageBreak())
add('4. Additional test workloads', 'Heading1')
add('These cases were proposed with AI assistance and checked against explicit scheduling rules. Each provides an expected result in addition to the simulator output. They are available in the workload library; all required invariants are checked separately.')
for i,e in enumerate(data['additional'],1):
    add(f"{i}. {e['name']}", 'Heading2')
    add('Inputs in list order: '+', '.join(f"{x['id']}(arrival={x['arrival']}, burst={x['burst']})" for x in e['processes'])+'.')
    expected = e['expected']
    chart = ', '.join(f"{s['processId'] or 'Idle'} [{s['start']},{s['end']})" for s in expected['segments'])
    add('<b>Independent expected timeline:</b> '+chart+'.')
    table(metric_head, metric_rows(expected['processes']), metric_widths)
    av = expected['averages']
    r=e['result']; add(f"<b>Verified:</b> {r['algorithm']} intervals and per-process metrics match. Expected and observed averages T/W/R: {fmt(av['turnaround'])} / {fmt(av['waiting'])} / {fmt(av['response'])}.")
add('Invariant and boundary checks', 'Heading2')
add('Across 100 fixed-seed workloads and all four policies, tests check burst conservation, arrival bounds, a contiguous non-overlapping timeline, nonnegative metrics and no idle CPU while work is ready. Targeted cases cover SRTF equality, RR boundary ordering and separate slices, completed jobs, first start at zero, input-order ties and invalid input. Independent q=1/q=4 references supplement these invariants.')

story.append(PageBreak())
add('5. Analysis', 'Heading1')
add('1. Workload A: lowest waiting and response', 'Heading2')
table(['Algorithm','Average turnaround','Average waiting','Average response'],[[e['algorithm'],fmt(e['actual']['averages']['turnaround']),fmt(e['actual']['averages']['waiting']),fmt(e['actual']['averages']['response'])] for e in data['examples'] if e['workload']=='A'],[105,130,130,130])
add('SRTF has the lowest average waiting (2.5) and response (0). It interrupts P1 for P2 at t=1 and P2 for P3 at t=2, and starts P4 immediately at t=4. Every process receives CPU service at its arrival in this particular workload, although P1 and P2 wait again after being interrupted. FCFS keeps short jobs behind P1; SJF can reorder jobs only after P1 finishes.')
add('2. Round Robin: q = 1, 2 and 4', 'Heading2')
table(['Quantum','Avg. turnaround','Avg. waiting','Avg. response'],[[r['quantum'],fmt(r['averages']['turnaround']),fmt(r['averages']['waiting']),fmt(r['averages']['response'])] for r in data['quantum']],[105,130,130,130])
add('For q=1, the unit-by-unit process order is P1,P2,P1,P3,P2,P1,P4,P3,P2,P1,P2,P1,P1,P1,P1. For q=4, the intervals are P1[0,4), P2[4,8), P3[8,10), P4[10,11), P1[11,15). The q=2 schedule is worked on its earlier example page.')
add('Reducing q from 2 to 1 improves average response from 1.75 to 0.75, but average waiting stays 4.75 and turnaround stays 8.5. Earlier first service does not imply earlier completion: P3 finishes later under q=1 while P4 finishes earlier. A smaller quantum redistributes turns and waiting; it does not minimize every metric. Context-switch cost is zero here, so these differences are not caused by switch overhead.')
add('3. When SJF and SRTF agree', 'Heading2')
add('They agree when each SJF-selected job can finish without any arrival having a strictly shorter burst than its current remaining time; the same tie rules must also apply. All jobs arriving together is a sufficient example. Workload B is another: P2 runs before P1, and at t=9 the newly arrived P4 only ties P3\'s remaining 1 unit. SRTF does not preempt, so both schedules are identical.')
add('4. Exact bursts versus real operating systems', 'Heading2')
add('The simulator receives complete burst lengths as input. A real OS generally cannot know how much CPU time a process will need before it blocks or completes; future behavior depends on program paths and inputs. It therefore estimates future bursts from past observations, for example by exponential averaging. This simulator intentionally removes that prediction problem to isolate scheduling-policy behavior.')

story.append(PageBreak())
add('6. Analysis, implementation and AI use', 'Heading1')
add('5. Starvation', 'Heading2')
add('SJF or SRTF can indefinitely delay a long job if new shorter jobs keep becoming ready. In these finite workloads, arrivals eventually stop and all bursts are finite, so remaining work eventually completes. A large finite waiting time is not itself proof of indefinite starvation.')
add('6. An implementation mistake exposed by a test', 'Heading2')
add('An initial mobile layout allowed a CSS grid column to retain its minimum content width. A Playwright check measured 533 px of page width in a 390 px viewport. The result grid was changed to minmax(0,1fr), panels were allowed to shrink, and tables/charts were given their own overflow regions. The same test then passed. This is an actual interface implementation bug, not an invented scheduling error.')
add('Implementation and limitations', 'Heading2')
add('The pure TypeScript scheduling motor is separate from React. It jumps to the next arrival, completion or quantum boundary, records each decision, and derives metrics from first start and completion. Original burst values are preserved separately from remaining work. The interface derives results from current inputs, clearing results on invalid input. Named workloads and theme preferences use optional browser storage; no backend or login is needed.')
add('Limits: at most 64 processes, 24 characters per process ID, integer times up to 1,000,000, maximum arrival plus total burst up to 1,000,000, and at most 2,000 RR slices. At most 12 named workloads are retained in a browser. Very small chart labels may be hidden in Fit mode; zoom, accessible button names and decision details retain the exact interval information.')
add('Validation evidence', 'Heading2')
add('Unit tests cover independent references and invariants; Playwright checks user flows, metric sorting, keyboard access and responsive layouts. The exporter asserts eight prior hand calculations and three additional references before printing a match. Current test counts, build results and OS evidence are recorded in docs/roadmap.md. Deployment availability requires a separate live check.')
add('AI-use statement', 'Heading2')
add('Codex assisted with assignment review, tutoring, checking the student\'s manual calculations, implementation, tests and this draft. Claude Code CLI provided design advice and a code review. Selected Decision Inspector and queue ideas were adapted from a Stitch prototype; its fixed data and script were not used as the engine. Prior hand calculations, independent references, invariants and browser tests verify the implementation.')
add('Corrections to AI suggestions: an earlier design brief used an idle interval of 5-8 for Workload B; the correct interval is 6-8 because the early jobs finish at t=6. A later design suggestion used process ID for tie-breaking; the assignment requires arrival followed by input-list order. Both suggestions were rejected. Student review and the ability to trace an unfamiliar workload remain necessary before submission.')
add('Sources and reproducibility', 'Heading2')
add('Requirements: <link href="https://mehmetgokturk.com/cse513/materials/assignment01/CSE513-Assignment-1.pdf" color="#244bd8">official CSE513 Assignment 1 PDF</link>. Code, README and test sources: the repository linked on page 1. Independent reference calculations: docs/hand-calculations.md. Additional cases: docs/additional-tests.md. Run pnpm install --frozen-lockfile, pnpm test, pnpm build, and pnpm test:e2e as described in the README.', 'SmallReport')

doc = SimpleDocTemplate(str(out/'CSE513-HW1-report-draft.pdf'), pagesize=A4, rightMargin=50, leftMargin=50, topMargin=44, bottomMargin=44, title='CSE513 Assignment 1 - Review draft', author=meta.get('name',''))
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(out/'CSE513-HW1-report-draft.pdf')
