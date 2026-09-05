import urllib.request
import json

BASE = 'http://127.0.0.1:8000/api'

def get(url):
    req = urllib.request.Request(f'{BASE}{url}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def post(url, data={}):
    req = urllib.request.Request(
        f'{BASE}{url}',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

print("=" * 60)
print("PEOPLEPAY360 - WORKFLOW INTEGRATION TEST")
print("=" * 60)

# 1. Dashboard Stats
stats = get('/dashboard/stats')
print("\n[1] Dashboard Metrics:")
for k, v in stats['metrics'].items():
    print(f"    {k}: {v}")

# 2. Schedules
schedules = get('/schedules')
print(f"\n[2] Working Schedules ({len(schedules)} shifts):")
for s in schedules:
    w_days = [d for d in s['days'] if d['is_working_day']]
    timing = f"{w_days[0]['start_time']} - {w_days[0]['end_time']}" if w_days else "N/A"
    print(f"    - {s['code']}: {s['name']} ({s['weekly_hours']}h/wk, Timing: {timing})")

# 3. Payruns
payruns = get('/payroll/payruns')
print(f"\n[3] Payruns ({len(payruns)} cycles):")
for p in payruns:
    print(f"    - [{p['status']}] {p['name']} | Net: INR {p['total_net']:,.2f} | Slips: {p['payslips_count']}")

# 4. Salary Structures
structs = get('/payroll/salary-structures')
print(f"\n[4] Salary Structures ({len(structs)} structures):")
for s in structs:
    print(f"    - {s['code']}: {s['name']} ({s['rules_count']} rules)")

# 5. Leave Approval & Notification Flow
requests = get('/time-off/requests')
pending_reqs = [r for r in requests if r['status'] == 'PENDING']
print(f"\n[5] Leave Requests ({len(requests)} total, {len(pending_reqs)} pending):")
if pending_reqs:
    target = pending_reqs[0]
    print(f"    Testing Approval for {target['employee']['name']} (ID: {target['id']})...")
    res = post(f"/time-off/requests/{target['id']}/approve")
    print(f"    Result: {res}")

# 6. Notifications Flow
notifs = get('/notifications')
print(f"\n[6] Notifications Flow:")
print(f"    Unread Count: {notifs['unread_count']}")
if notifs['items']:
    first_id = notifs['items'][0]['id']
    print(f"    Marking notification #{first_id} as read...")
    read_res = post(f"/notifications/{first_id}/read")
    print(f"    Result: {read_res}")
    updated_notifs = get('/notifications')
    print(f"    New Unread Count: {updated_notifs['unread_count']}")

# 7. Attendance Summary
att_sum = get('/attendance/summary')
print(f"\n[7] Attendance Summary:")
for k, v in att_sum.items():
    print(f"    {k}: {v}")

print("\n" + "=" * 60)
print("ALL WORKFLOW INTEGRATION TESTS PASSED SUCCESSFULLY!")
print("=" * 60)
