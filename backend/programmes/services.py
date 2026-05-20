# NUC Minimum Staff-to-Student Ratios by faculty type
NUC_STANDARDS = {
    'SCIENCE': {'ratio': 15, 'label': 'Science'},
    'ARTS': {'ratio': 30, 'label': 'Arts/Humanities'},
    'ENGINEERING': {'ratio': 10, 'label': 'Engineering'},
    'MEDICINE': {'ratio': 5, 'label': 'Medicine'},
    'LAW': {'ratio': 30, 'label': 'Law'},
    'SOCIAL_SCIENCE': {'ratio': 30, 'label': 'Social Sciences'},
    'EDUCATION': {'ratio': 30, 'label': 'Education'},
}

def check_ratio(student_count, staff_count, faculty_type='SCIENCE'):
    """
    Calculate staff-to-student ratio and check
    against NUC minimum standards.
    """
    if staff_count == 0:
        return {
            'ratio': None,
            'status': 'INVALID',
            'message': 'Staff count cannot be zero.',
            'compliant': False
        }

    actual_ratio = round(student_count / staff_count, 2)
    standard = NUC_STANDARDS.get(faculty_type.upper(), NUC_STANDARDS['SCIENCE'])
    max_ratio = standard['ratio']
    compliant = actual_ratio <= max_ratio

    return {
        'actual_ratio': actual_ratio,
        'max_allowed_ratio': max_ratio,
        'faculty_type': standard['label'],
        'compliant': compliant,
        'status': 'COMPLIANT' if compliant else 'NON_COMPLIANT',
        'message': (
            f"Ratio of 1:{actual_ratio} meets NUC standard of 1:{max_ratio}."
            if compliant else
            f"Ratio of 1:{actual_ratio} exceeds NUC maximum of 1:{max_ratio}. "
            f"More staff required."
        ),
        'staff_needed': max(0, round(student_count / max_ratio - staff_count))
    }