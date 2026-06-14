from programmes.pdf_generator import generate_pdf_report

sample = {
    'programme': 'Computer Science',
    'department': 'Computer Science',
    'faculty': 'Science',
    'status': 'DRAFT',
    'generated_at': '2026-06-14 12:00:00',
    'verdict': 'PARTIALLY READY',
    'score': 72,
    'passed': 18,
    'total': 25,
    'verdict_message': 'Some areas need attention.',
    'checks': [
        {'category': 'Curriculum', 'status': 'PASS', 'detail': 'Curriculum is up-to-date.', 'recommendation': ''},
        {'category': 'Staffing', 'status': 'WARNING', 'detail': 'Staffing levels are below recommended thresholds.', 'recommendation': 'Recruit 2 more senior lecturers.'},
        {'category': 'Facilities', 'status': 'FAIL', 'detail': 'Laboratory equipment is insufficient.', 'recommendation': 'Upgrade lab equipment.'}
    ]
}

buffer = generate_pdf_report(sample)
with open('test_report.pdf', 'wb') as f:
    f.write(buffer.getvalue())
print('Wrote test_report.pdf')
