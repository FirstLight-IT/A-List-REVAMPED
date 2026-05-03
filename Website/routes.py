from flask import Blueprint, render_template, request,redirect, url_for, session, abort
from flask_login import login_user, login_required, current_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from .models import User, Todo

bp = Blueprint('routes', __name__)

@bp.route('/register', methods=['GET', 'POST'])
def register():
    errors = []
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email').strip()
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if not username:
            errors.append("Username is required.")

        if not email or not password or not confirm_password:
            errors.append("All fields are required.")

        if password != confirm_password:
            errors.append("Passwords don't match!")

        if len(password) < 6:
            errors.append("Password must be at least 6 characters.")

        if User.query.filter_by(email=email).first():
            errors.append("Email already in use.")

        if not errors:
            #password hashing
            hashed_password = generate_password_hash(password)
            new_user = User( username=username, email=email, password_hash=hashed_password, role='user')
            db.session.add(new_user)
            db.session.commit()
            return redirect(url_for('routes.login'))
       

    return render_template('register.html', errors=errors)


@bp.route('/login', methods=['GET', 'POST'])
def login():

    errors = []

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password_hash, password):

            if not user:
                errors.append("No account found with that email")
            elif not check_password_hash(user.password_hash, password):
                errors.append("Incorrect Password!")

            return render_template('login.html', errors=errors)

        login_user(user)
        return redirect(url_for('routes.todo'))

    return render_template('login.html')

"""
@bp.route('/')
@login_required
def home():
    return render_template('home.html') 
"""

@bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('routes.login'))


@bp.route('/admin')
@login_required
def admin():
    if current_user.role != 'admin':
        abort(403)

    users = User.query.all()
    return render_template('admin.html', users=users)


@bp.app_errorhandler(403)
def forbidden(e):
    return render_template('denied-access.html'), 403


@bp.route('/', methods=['GET', 'POST'])
@login_required
def todo():
    if request.method == 'POST':
        task = request.form.get('task')

        if task.strip() == '':
            return redirect(url_for('routes.todo'))
        
        new_task = Todo(title=task, user_id=current_user.id)
        db.session.add(new_task)
        db.session.commit()

        return redirect(url_for('routes.todo'))
    

    todos = Todo.query.filter_by(user_id=current_user.id).all()
    return render_template('home.html', todos=todos)


@bp.route('/delete-task/<int:id>')
@login_required
def delete_task(id):
    task = Todo.query.get_or_404(id)

    if task.user_id != current_user.id:
        abort(404)

    db.session.delete(task)
    db.session.commit()
    return redirect(url_for('routes.todo'))