# RefugeeConnect Platform

## Overview

RefugeeConnect is a full-stack web application that connects refugee families with compassionate Swiss hosts. The platform operates as a managed marketplace where an NGO admin team reviews and approves all profiles before activation. The system facilitates safe matching, communication, and contract management between refugees seeking temporary accommodation and verified hosts offering housing support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **UI Components**: Radix UI primitives with custom styling for accessibility

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript for type safety across the entire stack
- **API Design**: RESTful API with WebSocket support for real-time messaging
- **Middleware**: Custom logging, error handling, and authentication middleware
- **File Structure**: Modular architecture with separate routing and storage layers

### Authentication & Authorization
- **Provider**: Replit Auth using OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL session store
- **Authorization**: Role-based access control (refugee, host, admin)
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for managed database hosting
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Session Storage**: PostgreSQL-backed session store for scalable session management

### Real-time Features
- **WebSocket Server**: Custom WebSocket implementation for real-time messaging
- **Message Delivery**: Live chat functionality between refugees and hosts
- **Notifications**: Real-time updates for profile approvals and contract status changes

### User Roles & Workflows
- **Admin Role**: Profile review and approval, system oversight, user management
- **Refugee Role**: Profile creation, host browsing, contract proposals, messaging
- **Host Role**: Profile creation, refugee discovery, contract negotiations, communication
- **Approval Process**: Three-tier profile status system (pending, approved, rejected)

### Component Architecture
- **Shared Schema**: Common TypeScript types and Zod schemas across client and server
- **UI Component Library**: Comprehensive set of reusable components with consistent styling
- **Form Components**: Specialized form components for profile registration and contract creation
- **Navigation**: Role-based navigation with responsive mobile support

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Auth**: OAuth/OIDC authentication service with user profile management
- **WebSocket**: Native WebSocket implementation for real-time communication

### Development Tools
- **Vite**: Frontend build tool with hot module replacement and development server
- **TypeScript**: Static typing across the entire application stack
- **Drizzle Kit**: Database schema management and migration tools
- **ESBuild**: Server-side bundling for production builds

### UI & Styling Libraries
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Radix UI**: Accessible component primitives for consistent user interface
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library with Tailwind integration

### Data & State Management
- **TanStack Query**: Server state management, caching, and data synchronization
- **React Hook Form**: Form state management with performance optimization
- **Zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities

### Session & Storage
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **express-session**: Session middleware for user authentication state
- **ws**: WebSocket library for real-time communication features