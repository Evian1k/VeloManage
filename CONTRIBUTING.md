# Contributing to AutoCare Pro

We love your input! We want to make contributing to AutoCare Pro as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Request Process

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## 📋 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## 🛠️ Development Setup

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Git

### Installation

1. **Clone your fork of the repository**
   ```bash
   git clone https://github.com/your-username/autocare-pro.git
   cd autocare-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📝 Writing Code

### Code Style

We use ESLint and Prettier for code formatting and linting. Please make sure your code follows our style guidelines:

- **JavaScript/JSX**: Follow Airbnb style guide
- **CSS**: Use Tailwind CSS utility classes
- **Components**: Use functional components with hooks
- **File naming**: Use PascalCase for components, camelCase for utilities

### Code Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── common/         # Common components (ErrorBoundary, etc.)
│   ├── admin/          # Admin-specific components
│   └── user/           # User-specific components
├── pages/              # Page components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   ├── constants.js    # Application constants
│   ├── helpers.js      # Helper functions
│   └── validation.js   # Validation utilities
├── lib/                # Third-party library configurations
└── assets/             # Static assets
```

### Component Guidelines

1. **Use functional components** with hooks instead of class components
2. **Extract custom hooks** for reusable logic
3. **Use TypeScript** for new components (when migrating to TS)
4. **Follow the single responsibility principle**
5. **Use descriptive prop names** and add PropTypes or TypeScript types

### Example Component Structure

```jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { validateEmail } from '@/utils/validation';

const MyComponent = ({ title, onSubmit, className = '' }) => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validation = validateEmail(email);
    setIsValid(validation.isValid);
  }, [email]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-bold">{title}</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Enter email"
      />
      <Button type="submit" disabled={!isValid}>
        Submit
      </Button>
    </form>
  );
};

export default MyComponent;
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new functionality
- Use Jest and React Testing Library
- Follow the AAA pattern (Arrange, Act, Assert)
- Test user interactions, not implementation details

### Example Test

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should submit valid email', () => {
    const mockSubmit = jest.fn();
    render(<MyComponent title="Test" onSubmit={mockSubmit} />);
    
    const input = screen.getByPlaceholderText('Enter email');
    const button = screen.getByText('Submit');
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);
    
    expect(mockSubmit).toHaveBeenCalledWith('test@example.com');
  });
});
```

## 🐛 Bug Reports

Great Bug Reports tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Bug Report Template

```
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional Context**
Add any other context about the problem here.
```

## 🎯 Feature Requests

We love feature requests! Before submitting one, please check if it already exists in our issues.

### Feature Request Template

```
**Feature Description**
A clear and concise description of what you want to happen.

**Problem Statement**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Proposed Solution**
A clear and concise description of what you want to happen.

**Alternatives Considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional Context**
Add any other context or screenshots about the feature request here.
```

## 📚 Documentation

- Update README.md for significant changes
- Add JSDoc comments for complex functions
- Update this CONTRIBUTING.md if the process changes
- Consider adding examples for new features

## 🏷️ Commit Messages

We follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect meaning (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process or auxiliary tools

### Examples

```
feat(auth): add password reset functionality
fix(ui): resolve button alignment issue on mobile
docs(readme): update installation instructions
style(header): improve responsive layout
refactor(utils): extract validation functions
test(auth): add tests for login component
chore(deps): update React to v18.2.0
```

## 🚀 Release Process

1. Version is bumped using semantic versioning
2. Changelog is updated with new features and fixes
3. Release notes are created
4. Release is tagged and published

## 📞 Getting Help

- 💬 Join our [Discord](https://discord.gg/autocare-pro) for real-time discussion
- 📧 Email us at support@autocare.com
- 🐛 Create an issue for bug reports
- 💡 Start a discussion for feature ideas

## 🎉 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- Special recognition for long-term maintainers

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🤝 Contributor Covenant

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/).

---

Thank you for contributing to AutoCare Pro! 🚗✨