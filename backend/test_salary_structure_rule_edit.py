import urllib.request, urllib.error, json

BASE_URL = 'http://127.0.0.1:8000/api/payroll'

def make_request(url, method='GET', data=None, headers=None):
    if headers is None:
        headers = {'Content-Type': 'application/json', 'X-User-Role': 'ADMIN'}
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def test_salary_structure_and_rule_modifications():
    print('=== 1. Test Salary Rule Creation ===')
    rule_payload = {
        'name': 'Special Client Bonus Rule',
        'code': 'TEST_BONUS_101',
        'category': 'ALLOWANCE',
        'sequence': 88,
        'calculation_type': 'PERCENTAGE',
        'percentage': 8.5,
        'description': 'Test bonus allowance for performance projects',
        'is_active': True
    }
    status, created_rule = make_request(f'{BASE_URL}/salary-rules', 'POST', rule_payload)
    print('Create Rule Status:', status, 'Rule ID:', created_rule.get('id'), 'Code:', created_rule.get('code'))
    assert status == 200, f'Expected 200, got {status}: {created_rule}'
    assert created_rule['code'] == 'TEST_BONUS_101'
    assert created_rule['percentage'] == 8.5
    rule_id = created_rule['id']

    print('\n=== 2. Test Salary Rule Modification / Edit ===')
    update_payload = {
        'name': 'Updated Client Bonus Rule',
        'percentage': 11.25,
        'sequence': 92,
        'description': 'Updated description with higher rate'
    }
    status, updated_rule = make_request(f'{BASE_URL}/salary-rules/{rule_id}', 'PUT', update_payload)
    print('Update Rule Status:', status, 'New Name:', updated_rule.get('name'), 'New Rate:', updated_rule.get('percentage'), 'Sequence:', updated_rule.get('sequence'))
    assert status == 200, f'Expected 200, got {status}: {updated_rule}'
    assert updated_rule['name'] == 'Updated Client Bonus Rule'
    assert updated_rule['percentage'] == 11.25
    assert updated_rule['sequence'] == 92

    print('\n=== 3. Test Salary Structure Creation with Rules ===')
    struct_payload = {
        'name': 'Test Performance Structure',
        'code': 'IND_TEST_PERF',
        'description': 'Custom compensation architecture for testing',
        'is_active': True,
        'rule_ids': [1, 2, int(rule_id)]
    }
    status, created_struct = make_request(f'{BASE_URL}/salary-structures', 'POST', struct_payload)
    print('Create Structure Status:', status, 'ID:', created_struct.get('id'), 'Rules count:', created_struct.get('rules_count'))
    assert status == 200, f'Expected 200, got {status}: {created_struct}'
    assert created_struct['code'] == 'IND_TEST_PERF'
    assert created_struct['rules_count'] == 3
    struct_id = created_struct['id']

    print('\n=== 4. Test Salary Structure Modification / Edit & Rule Sync ===')
    struct_update_payload = {
        'name': 'Modified Performance Architecture',
        'description': 'Updated framework with reordered and added rules',
        'rule_ids': [1, 2, 3, int(rule_id)]
    }
    status, updated_struct = make_request(f'{BASE_URL}/salary-structures/{struct_id}', 'PUT', struct_update_payload)
    print('Update Structure Status:', status, 'New Name:', updated_struct.get('name'), 'New Rules Count:', updated_struct.get('rules_count'))
    assert status == 200, f'Expected 200, got {status}: {updated_struct}'
    assert updated_struct['name'] == 'Modified Performance Architecture'
    assert updated_struct['rules_count'] == 4

    print('\n=== 5. Test RBAC Enforcement (Employee Role Restriction) ===')
    emp_headers = {'Content-Type': 'application/json', 'X-User-Role': 'EMPLOYEE'}
    status, err_resp = make_request(f'{BASE_URL}/salary-rules/{rule_id}', 'PUT', {'percentage': 99.0}, headers=emp_headers)
    print('Employee Role Edit Attempt: Status', status, '(Expected 403 Forbidden)')
    assert status == 403, f'Expected 403, got {status}'

    print('\n=== 6. Cleanup Test Data ===')
    make_request(f'{BASE_URL}/salary-structures/{struct_id}', 'DELETE')
    make_request(f'{BASE_URL}/salary-rules/{rule_id}', 'DELETE')
    print('Cleanup completed successfully.')

    print('\n>>> ALL 6 SALARY STRUCTURE & RULE EDIT INTEGRATION TESTS PASSED! <<<')

if __name__ == '__main__':
    test_salary_structure_and_rule_modifications()
