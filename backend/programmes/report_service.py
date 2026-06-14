from datetime import datetime
from .services import check_ratio, NUC_STANDARDS

REQUIRED_DOCUMENT_CATEGORIES = [
    'CURRICULUM',
    'STAFF_LIST',
    'FACILITY',
    'FINANCIAL',
]

def generate_readiness_report(programme):
    """
    Analyse a programme against NUC requirements
    and return a detailed readiness report.
    """
    checks = []
    passed = 0
    total = 0

    # ── Check 1: Student count ──────────────────────────
    total += 1
    if programme.student_count > 0:
        checks.append({
            'category': 'Student Enrollment',
            'status': 'PASS',
            'detail': f'{programme.student_count} students enrolled.',
            'recommendation': None
        })
        passed += 1
    else:
        checks.append({
            'category': 'Student Enrollment',
            'status': 'FAIL',
            'detail': 'No students enrolled.',
            'recommendation': 'Enter the total number of enrolled students for this programme.'
        })

    # ── Check 2: Staff count ────────────────────────────
    total += 1
    if programme.staff_count > 0:
        checks.append({
            'category': 'Academic Staff',
            'status': 'PASS',
            'detail': f'{programme.staff_count} academic staff registered.',
            'recommendation': None
        })
        passed += 1
    else:
        checks.append({
            'category': 'Academic Staff',
            'status': 'FAIL',
            'detail': 'No academic staff registered.',
            'recommendation': 'Enter the total number of academic staff for this programme.'
        })

    # ── Check 3: Staff-to-student ratio ────────────────
    total += 1
    faculty_type = programme.faculty.upper().replace(' ', '_')
    if faculty_type not in NUC_STANDARDS:
        faculty_type = 'SCIENCE'

    ratio_result = check_ratio(
        programme.student_count,
        programme.staff_count,
        faculty_type
    )

    if ratio_result.get('status') == 'INVALID':
        checks.append({
            'category': 'Staff-to-Student Ratio',
            'status': 'FAIL',
            'detail': ratio_result.get('message', 'Staff count cannot be zero.'),
            'recommendation': 'Register academic staff members for this programme to calculate the ratio.'
        })
    elif ratio_result.get('compliant'):
        checks.append({
            'category': 'Staff-to-Student Ratio',
            'status': 'PASS',
            'detail': f"Ratio of 1:{ratio_result['actual_ratio']} meets NUC standard of 1:{ratio_result['max_allowed_ratio']} for {ratio_result['faculty_type']}.",
            'recommendation': None
        })
        passed += 1
    else:
        checks.append({
            'category': 'Staff-to-Student Ratio',
            'status': 'FAIL',
            'detail': f"Ratio of 1:{ratio_result['actual_ratio']} exceeds NUC maximum of 1:{ratio_result['max_allowed_ratio']} for {ratio_result['faculty_type']}.",
            'recommendation': f"Hire at least {ratio_result['staff_needed']} more academic staff to meet NUC requirements."
        })

    # ── Check 4: Required documents uploaded ───────────
    documents = programme.documents.all()
    uploaded_categories = list(documents.values_list('category', flat=True))

    for category in REQUIRED_DOCUMENT_CATEGORIES:
        total += 1
        label = category.replace('_', ' ').title()
        if category in uploaded_categories:
            # Check if verified
            verified = documents.filter(category=category, status='VERIFIED').exists()
            if verified:
                checks.append({
                    'category': f'{label} Document',
                    'status': 'PASS',
                    'detail': f'{label} document uploaded and verified by APU.',
                    'recommendation': None
                })
                passed += 1
            else:
                checks.append({
                    'category': f'{label} Document',
                    'status': 'WARNING',
                    'detail': f'{label} document uploaded but not yet verified by APU.',
                    'recommendation': f'Request APU Officer to verify the {label} document.'
                })
        else:
            checks.append({
                'category': f'{label} Document',
                'status': 'FAIL',
                'detail': f'{label} document has not been uploaded.',
                'recommendation': f'Upload the {label} document to the Evidence Locker.'
            })

    # ── Check 5: Milestones ─────────────────────────────
    milestones = programme.milestones.all()
    total += 1
    if milestones.count() == 0:
        checks.append({
            'category': 'Milestones',
            'status': 'FAIL',
            'detail': 'No milestones have been set for this programme.',
            'recommendation': 'Add accreditation milestones with due dates to track progress.'
        })
    else:
        completed = milestones.filter(status='COMPLETED').count()
        overdue = milestones.filter(status='OVERDUE').count()
        total_ms = milestones.count()

        if overdue > 0:
            checks.append({
                'category': 'Milestones',
                'status': 'FAIL',
                'detail': f'{overdue} milestone(s) are overdue out of {total_ms} total.',
                'recommendation': 'Address overdue milestones immediately before submission.'
            })
        elif completed == total_ms:
            checks.append({
                'category': 'Milestones',
                'status': 'PASS',
                'detail': f'All {total_ms} milestones completed.',
                'recommendation': None
            })
            passed += 1
        else:
            checks.append({
                'category': 'Milestones',
                'status': 'WARNING',
                'detail': f'{completed} of {total_ms} milestones completed.',
                'recommendation': 'Complete remaining milestones before submitting for accreditation.'
            })

    # ── Overall Score ───────────────────────────────────
    score = round((passed / total) * 100) if total > 0 else 0

    if score == 100:
        verdict = 'READY'
        verdict_message = 'This programme meets all NUC accreditation requirements and is ready for submission.'
    elif score >= 70:
        verdict = 'PARTIALLY READY'
        verdict_message = 'This programme meets most requirements but has outstanding items that must be resolved before submission.'
    else:
        verdict = 'NOT READY'
        verdict_message = 'This programme does not meet the minimum NUC accreditation requirements. Significant work is required before submission.'

    return {
        'programme': programme.name,
        'department': programme.department,
        'faculty': programme.faculty,
        'status': programme.status,
        'generated_at': datetime.now().strftime('%d %B %Y, %I:%M %p'),
        'score': score,
        'passed': passed,
        'total': total,
        'verdict': verdict,
        'verdict_message': verdict_message,
        'checks': checks
    }