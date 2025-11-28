# Smoke Background Animation Component

An animated WebGL-based smoke background effect component for the Smokava app.

## Files

- `spooky-smoke-animation.tsx` - Main component with WebGL shader animation
- `SmokeBackgroundWrapper.tsx` - Wrapper component for easy page integration
- `smoke-background-demo.tsx` - Example usage patterns

## Usage

### Basic Usage

```tsx
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";

export default function MyPage() {
  return (
    <div className="relative min-h-screen">
      <SmokeBackground smokeColor="#808080" />
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

### Using the Wrapper Component

```tsx
import { SmokeBackgroundWrapper } from "@/components/ui/SmokeBackgroundWrapper";

export default function MyPage() {
  return (
    <SmokeBackgroundWrapper smokeColor="#ff6b35">
      {/* Your page content */}
    </SmokeBackgroundWrapper>
  );
}
```

### Custom Colors

The component accepts a `smokeColor` prop in hex format:

```tsx
// Purple smoke (matches app theme)
<SmokeBackground smokeColor="#8A2BE2" />

// Orange-red smoke (matches accent color)
<SmokeBackground smokeColor="#ff6b35" />

// Custom color
<SmokeBackground smokeColor="#FF5733" />
```

## Integration Examples

### Add to Root Layout (App-wide Background)

Edit `app/layout.tsx`:

```tsx
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-dark-400 text-white font-sans antialiased relative">
        <SmokeBackground smokeColor="#8A2BE2" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
```

### Add to Specific Page

Edit any page file (e.g., `app/auth/page.tsx`):

```tsx
import { SmokeBackgroundWrapper } from "@/components/ui/SmokeBackgroundWrapper";

export default function AuthPage() {
  return (
    <SmokeBackgroundWrapper smokeColor="#ff6b35">
      {/* Your existing page content */}
    </SmokeBackgroundWrapper>
  );
}
```

## Props

### SmokeBackground

- `smokeColor?: string` - Hex color code (default: "#808080")
- `className?: string` - Additional Tailwind CSS classes

### SmokeBackgroundWrapper

- `children: React.ReactNode` - Page content to display
- `smokeColor?: string` - Hex color code (default: "#808080")
- `className?: string` - Additional Tailwind CSS classes for the wrapper

## Technical Details

- Uses WebGL2 for hardware-accelerated rendering
- Automatically handles window resizing
- Cleans up resources on unmount
- Falls back gracefully if WebGL2 is not supported

## Browser Support

Requires WebGL2 support. Modern browsers (Chrome, Firefox, Safari, Edge) all support WebGL2.
