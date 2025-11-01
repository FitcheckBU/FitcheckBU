## AI Behavior Guidelines

- **Layout and Components:** When creating new pages or components, follow the existing patterns. Use the `MainLayout` component from `App.tsx` and avoid wrapping content in `IonPage` unless necessary for specific Ionic functionalities.

- **Linting and Code Quality:** After making any code changes, run the lint tests to ensure the code adheres to the project's style guidelines. Fix any linting errors before finalizing your changes.

- **Version Control:** Do not commit or push any changes to the repository unless explicitly instructed to do so.

- **Code Comments:** Add comments to your code where the logic is complex or not immediately obvious. Avoid commenting on code that is self-explanatory.

- **Testing:** When adding new features, also add corresponding tests to ensure the feature works as expected and to prevent future regressions.

- **Dependencies:** If you need to add new dependencies, use `npm` or `yarn` to add them and ensure they are included in the `package.json` file.
