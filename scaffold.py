import os

def create_structure(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        else:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

frontend_dirs = {
    'src': {
        'assets': {},
        'components': {
            'ui': {},
            'layout': {},
            'common': {},
            'forms': {}
        },
        'features': {
            'auth': {},
            'employee': {},
            'attendance': {},
            'time-off': {},
            'payroll': {},
            'notifications': {}
        },
        'pages': {},
        'layouts': {},
        'hooks': {},
        'lib': {},
        'services': {},
        'types': {},
        'constants': {},
        'routes': {},
        'providers': {},
    }
}

backend_dirs = {
    'app': {
        'api': {
            'routes': {},
            'dependencies': {}
        },
        'core': {
            'config.py': '',
            'security.py': '',
            'database.py': ''
        },
        'models': {},
        'schemas': {},
        'services': {},
        'repositories': {},
        'payroll': {
            'payroll_engine.py': '',
            'rules.py': '',
            'calculations.py': '',
            'validators.py': ''
        },
        'auth': {
            'router.py': '',
            'service.py': '',
            'dependencies.py': ''
        },
        'main.py': ''
    },
    'alembic': {},
    'tests': {},
}

root_structure = {
    'frontend': frontend_dirs,
    'backend': backend_dirs,
    'docs': {},
    '.gitignore': '',
    'README.md': '',
    'docker-compose.yml': ''
}

if __name__ == '__main__':
    base_dir = r"C:\Users\Acer\Documents\PeoplePay360"
    create_structure(base_dir, root_structure)
    print("Project scaffolded successfully.")
