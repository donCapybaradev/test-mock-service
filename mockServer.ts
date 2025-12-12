import { faker } from "@faker-js/faker"
import express from "express"
import multer from "multer"

const uploadPdfs = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB por archivo
		files: 10 // Máximo 10 archivos
	},
	fileFilter: (_req, file, cb) => {
		if (file.mimetype === "application/pdf") {
			cb(null, true)
		} else {
			cb(new Error("Solo se permiten archivos PDF"))
		}
	}
})



interface LibraryElement {
	id: string
	title: string
	category: string
	description: string
}

interface Library {
	id: string
	title: string
	contextCount: number
	elements?: LibraryElement[]
}

interface Organization {
	id: string
	name: string
	description: string
	owner_id: string
	created_at: string
}

interface OrganizationUser {
	user_id: string
	organization_id: string
	role: "admin" | "member"
	added_at: string
}

interface User {
	user_id: string
	email: string
	name: string
}

const librariesStore = new Map<string, Library>()
const libraryElementsStore = new Map<string, LibraryElement[]>()
const organizationsStore = new Map<string, Organization>()
const organizationUsersStore = new Map<string, OrganizationUser[]>()
const usersStore = new Map<string, User>()



// Org-002: 7 libraries
const org002Libraries: Library[] = [
	{ id: "lib-org002-001", title: "React Patterns", contextCount: 8 },
	{ id: "lib-org002-002", title: "TypeScript Best Practices", contextCount: 12 },
	{ id: "lib-org002-003", title: "API Design Guide", contextCount: 10 },
	{ id: "lib-org002-004", title: "Database Optimization", contextCount: 15 },
	{ id: "lib-org002-005", title: "Testing Strategies", contextCount: 9 },
	{ id: "lib-org002-006", title: "Security Standards", contextCount: 11 },
	{ id: "lib-org002-007", title: "Performance Tuning", contextCount: 7 }
]

// Org-001: 12 libraries
const org001Libraries: Library[] = [
	{ id: "lib-org001-001", title: "Code Review Guidelines", contextCount: 6 },
	{ id: "lib-org001-002", title: "Microservices Architecture", contextCount: 14 },
	{ id: "lib-org001-003", title: "Cloud Deployment", contextCount: 11 },
	{ id: "lib-org001-004", title: "DevOps Best Practices", contextCount: 13 },
	{ id: "lib-org001-005", title: "Monitoring and Logging", contextCount: 10 },
	{ id: "lib-org001-006", title: "Authentication & Authorization", contextCount: 12 },
	{ id: "lib-org001-007", title: "Database Design", contextCount: 15 },
	{ id: "lib-org001-008", title: "Frontend Optimization", contextCount: 9 },
	{ id: "lib-org001-009", title: "API Security", contextCount: 8 },
	{ id: "lib-org001-010", title: "Testing Frameworks", contextCount: 11 },
	{ id: "lib-org001-011", title: "CI/CD Pipelines", contextCount: 13 },
	{ id: "lib-org001-012", title: "Documentation Standards", contextCount: 7 }
]

const initialLibraries: Library[] = [...org001Libraries, ...org002Libraries]

initialLibraries.forEach((library) => {
	librariesStore.set(library.id, library)
})

const initialOrganizations: Organization[] = [
	{
		id: "org-001",
		name: "Acme Corporation",
		description: "Empresa líder en soluciones tecnológicas innovadoras",
		owner_id: "user-001",
		created_at: "2024-01-15T10:30:00.000Z"
	},
	{
		id: "org-002",
		name: "StartupX Labs",
		description: "Laboratorio de innovación y desarrollo de productos digitales",
		owner_id: "user-002",
		created_at: "2024-03-22T14:45:00.000Z"
	}
]

initialOrganizations.forEach((org) => {
	organizationsStore.set(org.id, org)
})

export const createMockServer = (port: number = 3002) => {
	const app = express()

	app.use(express.json())
	app.use(express.urlencoded({ extended: true }))
	
	// CORS middleware
	app.use((req, res, next) => {
		res.header("Access-Control-Allow-Origin", "*")
		res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, org-id")
		
		if (req.method === "OPTIONS") {
			return res.sendStatus(200)
		}
		next()
	})

	/**
	 * POST /library/:id/contexts - Create a new context element in a library with optional PDF files
	 */
	app.post("/library/:id/contexts", uploadPdfs.array("files", 10), (req, res) => {
		const orgId = req.headers["org-id"] as string
		const libraryId = req.params.id
		const { description } = req.body
		const files = req.files as Express.Multer.File[] | undefined

		if (!orgId || !["org-001", "org-002"].includes(orgId)) {
			return res.status(400).json({
				success: false,
				message: "Invalid or missing org-id header. Must be org-001 or org-002"
			})
		}

		if (!description || description.toString().trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: "description is required"
			})
		}

		const library = librariesStore.get(libraryId)
		if (!library) {
			return res.status(404).json({
				success: false,
				message: "Library not found"
			})
		}

		// Verificar que la library pertenece a la org
		const orgLibraries = orgId === "org-001" ? org001Libraries : org002Libraries
		const belongsToOrg = orgLibraries.some((lib) => lib.id === libraryId)

		if (!belongsToOrg) {
			return res.status(403).json({
				success: false,
				message: "Library not found in this organization"
			})
		}

		const categories = ["Best Practice", "Documentation", "Example", "Tutorial", "Reference", "Guide"]
		const randomCategory = categories[Math.floor(Math.random() * categories.length)]

		const uploadedFiles = (files || []).map((file) => ({
			name: file.originalname,
			size: file.size,
			type: file.mimetype
		}))

		const newElement: LibraryElement = {
			id: faker.string.uuid(),
			title: description,
			category: randomCategory,
			description: description
		}

		// Agregar el elemento al store
		if (!libraryElementsStore.has(libraryId)) {
			libraryElementsStore.set(libraryId, [])
		}
		libraryElementsStore.get(libraryId)!.push(newElement)

		// Incrementar contextCount
		library.contextCount += 1

		res.status(201).json({
			success: true,
			element: newElement,
			filesUploaded: uploadedFiles.length,
			files: uploadedFiles,
			newContextCount: library.contextCount
		})
	})

	/**
	 * GET /libraries - List all libraries for an organization with pagination and search
	 */
	app.get("/libraries", (req, res) => {
		const orgId = req.headers["org-id"] as string

		if (!orgId || !["org-001", "org-002"].includes(orgId)) {
			return res.status(400).json({
				success: false,
				message: "Invalid or missing org-id header. Must be org-001 or org-002"
			})
		}

		const page = parseInt(req.query.page as string, 10) || 1
		const limit = parseInt(req.query.limit as string, 10) || 8
		const search = (req.query.search as string || "").toLowerCase().trim()
		const offset = (page - 1) * limit

		const categories = ["Best Practice", "Documentation", "Example", "Tutorial", "Reference", "Guide"]
		const titles = [
			"Introducción a conceptos fundamentales",
			"Patrones y arquitecturas comunes",
			"Casos de uso avanzados",
			"Integración con sistemas externos",
			"Optimización y rendimiento",
			"Debugging y troubleshooting",
			"Configuración inicial",
			"Mejores prácticas",
			"Solución de problemas",
			"Casos de éxito"
		]

		// Filtrar libraries por organización
		const orgLibraries = orgId === "org-001" ? org001Libraries : org002Libraries
		let allLibraries = orgLibraries.filter((lib) => librariesStore.has(lib.id))

		if (search) {
			allLibraries = allLibraries.filter((library) => {
				if (library.title.toLowerCase().includes(search)) {
					return true
				}
				// Generar elementos para búsqueda
				const libraryIdHash = library.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
				const totalElements = library.contextCount
				const titleOffset = libraryIdHash % titles.length

				// Crear elementos temporales para búsqueda
				for (let i = 0; i < totalElements; i++) {
					const elementTitle = titles[(i + titleOffset) % titles.length]
					const elementDescription = faker.lorem.sentences(2)

					if (
						elementTitle.toLowerCase().includes(search) ||
						elementDescription.toLowerCase().includes(search)
					) {
						return true
					}
				}
				return false
			})
		}

		const paginatedLibraries = allLibraries.slice(offset, offset + limit)
		const totalPages = Math.ceil(allLibraries.length / limit)

		res.json({
			success: true,
			orgId,
			libraries: paginatedLibraries,
			count: paginatedLibraries.length,
			total: allLibraries.length,
			page,
			limit,
			totalPages,
			hasMore: page < totalPages
		})
	})

	/**
	 * GET /library/:id - Get a specific library with paginated elements and search
	 */
	app.get("/library/:id", (req, res) => {
		const orgId = req.headers["org-id"] as string

		if (!orgId || !["org-001", "org-002"].includes(orgId)) {
			return res.status(400).json({
				success: false,
				message: "Invalid or missing org-id header. Must be org-001 or org-002"
			})
		}

		const library = librariesStore.get(req.params.id)

		if (!library) {
			return res.status(404).json({
				success: false,
				message: "Library not found"
			})
		}

		// Verificar que la library pertenece a la org
		const orgLibraries = orgId === "org-001" ? org001Libraries : org002Libraries
		const belongsToOrg = orgLibraries.some((lib) => lib.id === req.params.id)

		if (!belongsToOrg) {
			return res.status(403).json({
				success: false,
				message: "Library not found in this organization"
			})
		}

		const page = parseInt(req.query.page as string, 10) || 1
		const limit = parseInt(req.query.limit as string, 10) || 8
		const search = (req.query.search as string || "").toLowerCase().trim()
		const offset = (page - 1) * limit

		const categories = ["Best Practice", "Documentation", "Example", "Tutorial", "Reference", "Guide"]
		const titles = [
			"Introducción a conceptos fundamentales",
			"Patrones y arquitecturas comunes",
			"Casos de uso avanzados",
			"Integración con sistemas externos",
			"Optimización y rendimiento",
			"Debugging y troubleshooting",
			"Configuración inicial",
			"Mejores prácticas",
			"Solución de problemas",
			"Casos de éxito"
		]

		// Obtener elementos del store o generar dinámicamente si no existen
		const storedElements = libraryElementsStore.get(req.params.id) || []
		const totalElements = library.contextCount
		const libraryIdHash = req.params.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
		let allElements: LibraryElement[] = [...storedElements]

		// Generar elementos dinámicamente hasta completar el contextCount
		const titleOffset = libraryIdHash % titles.length
		const categoryOffset = libraryIdHash % categories.length

		for (let i = storedElements.length; i < totalElements; i++) {
			allElements.push({
				id: faker.string.uuid(),
				title: titles[(i + titleOffset) % titles.length],
				category: categories[(i + categoryOffset) % categories.length],
				description: faker.lorem.sentences(2)
			})
		}

		// Aplicar filtro de búsqueda si existe
		if (search) {
			allElements = allElements.filter(
				(element) =>
					element.title.toLowerCase().includes(search) ||
					element.description.toLowerCase().includes(search)
			)
		}

		const paginatedElements = allElements.slice(offset, offset + limit)
		const totalPages = Math.ceil(allElements.length / limit)

		res.json({
			success: true,
			...library,
			name: library.title,
			elements: paginatedElements,
			elementsCount: paginatedElements.length,
			totalElements: allElements.length,
			page,
			limit,
			totalPages,
			hasMore: page < totalPages
		})
	})

	/**
	 * GET /library/:libraryId/context/:contextId - Get specific context details
	 */
	app.get("/library/:libraryId/context/:contextId", (req, res) => {
		const orgId = req.headers["org-id"] as string
		const { libraryId, contextId } = req.params

		// Validar org-id (opcional según el patrón)
		if (orgId && !["org-001", "org-002"].includes(orgId)) {
			return res.status(400).json({
				success: false,
				message: "Invalid org-id header. Must be org-001 or org-002"
			})
		}

		// Obtener la library
		const library = librariesStore.get(libraryId)
		if (!library) {
			return res.status(404).json({
				success: false,
				message: "Library not found"
			})
		}

		// Si se proporciona org-id, validar que la library pertenece a esa org
		if (orgId) {
			const orgLibraries = orgId === "org-001" ? org001Libraries : org002Libraries
			const belongsToOrg = orgLibraries.some((lib) => lib.id === libraryId)

			if (!belongsToOrg) {
				return res.status(403).json({
					success: false,
					message: "Library not found in this organization"
				})
			}
		}

		// Obtener elementos de la library
		const storedElements = libraryElementsStore.get(libraryId) || []
		
		// Buscar el contexto específico
		const context = storedElements.find((el) => el.id === contextId)

		if (!context) {
			return res.status(404).json({
				success: false,
				message: "Context not found in this library"
			})
		}

		res.json({
			success: true,
			libraryId,
			library: {
				id: library.id,
				title: library.title,
				contextCount: library.contextCount
			},
			context: {
				id: context.id,
				title: context.title,
				category: context.category,
				description: context.description
			}
		})
	})

	/**
	 * GET /organizations - List all organizations
	 */
	app.get("/organizations", (req, res) => {
		const authHeader = req.headers.authorization
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ detail: "Unauthorized" })
		}

		const organizations = Array.from(organizationsStore.values())
		res.json({ organizations })
	})

	/**
	 * POST /organizations - Create a new organization
	 */
	app.post("/organizations", (req, res) => {
		const { name, owner_id } = req.body

		if (!name || !owner_id) {
			return res.status(400).json({
				detail: "name and owner_id are required"
			})
		}

		const id = faker.string.uuid()
		const organization: Organization = {
			id,
			name,
			description: req.body.description || "",
			owner_id,
			created_at: new Date().toISOString()
		}

		organizationsStore.set(id, organization)
		organizationUsersStore.set(id, [
			{
				user_id: owner_id,
				organization_id: id,
				role: "admin",
				added_at: new Date().toISOString()
			}
		])

		res.status(201).json(organization)
	})

	/**
	 * POST /organizations/:organization_id/users - Add user to organization
	 */
	app.post("/organizations/:organization_id/users", (req, res) => {
		const { organization_id } = req.params
		const { user_id, role = "member" } = req.body

		if (!organizationsStore.has(organization_id)) {
			return res.status(404).json({ detail: "Organization not found" })
		}

		if (!user_id) {
			return res.status(400).json({ detail: "user_id is required" })
		}

		const users = organizationUsersStore.get(organization_id) || []
		const existingUser = users.find((u) => u.user_id === user_id)
		if (existingUser) {
			return res.status(400).json({ detail: "User already in organization" })
		}

		const newUser: OrganizationUser = {
			user_id,
			organization_id,
			role: role === "admin" ? "admin" : "member",
			added_at: new Date().toISOString()
		}
		users.push(newUser)
		organizationUsersStore.set(organization_id, users)

		res.status(201).json({})
	})

	/**
	 * GET /organizations/:organization_id/users - List users in organization
	 */
	app.get("/organizations/:organization_id/users", (req, res) => {
		const { organization_id } = req.params
		const size = parseInt(req.query.size as string, 10) || 20
		const cursor = req.query.cursor as string | undefined

		if (!organizationsStore.has(organization_id)) {
			return res.status(404).json({ detail: "Organization not found" })
		}

		const users = organizationUsersStore.get(organization_id) || []
		let startIndex = 0

		if (cursor) {
			const cursorIndex = users.findIndex((u) => u.user_id === cursor)
			if (cursorIndex !== -1) {
				startIndex = cursorIndex + 1
			}
		}

		const paginatedUsers = users.slice(startIndex, startIndex + size)
		const nextCursor =
			startIndex + size < users.length
				? users[startIndex + size - 1]?.user_id
				: null

		res.json({
			users: paginatedUsers.map((u) => ({
				user_id: u.user_id,
				role: u.role
			})),
			next_cursor: nextCursor
		})
	})

	/**
	 * DELETE /organizations/:organization_id/users - Remove user from organization
	 */
	app.delete("/organizations/:organization_id/users", (req, res) => {
		const { organization_id } = req.params
		const { user_id } = req.body

		if (!organizationsStore.has(organization_id)) {
			return res.status(404).json({ detail: "Organization not found" })
		}

		if (!user_id) {
			return res.status(400).json({ detail: "user_id is required" })
		}

		const users = organizationUsersStore.get(organization_id) || []
		const userIndex = users.findIndex((u) => u.user_id === user_id)

		if (userIndex === -1) {
			return res.status(404).json({ detail: "User not found in organization" })
		}

		users.splice(userIndex, 1)
		organizationUsersStore.set(organization_id, users)

		res.status(204).send()
	})

	/**
	 * POST /check-access - Check if user has access to perform action on resource
	 */
	app.post("/check-access", (req, res) => {
		const { user_id, action, resource_type, resource_id } = req.body

		if (!user_id || !action || !resource_type || !resource_id) {
			return res.status(400).json({
				detail: "user_id, action, resource_type, and resource_id are required"
			})
		}

		let allowed = false

		if (resource_type === "organization") {
			const users = organizationUsersStore.get(resource_id) || []
			const orgUser = users.find((u) => u.user_id === user_id)

			if (orgUser) {
				if (action === "read") {
					allowed = true
				} else if (action === "write" || action === "delete") {
					allowed = orgUser.role === "admin"
				}
			}
		}

		res.json({ allowed })
	})

	/**
	 * GET /users/me - Get current user info (mock)
	 */
	app.get("/users/me", (req, res) => {
		const authHeader = req.headers.authorization
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ detail: "Unauthorized" })
		}

		const mockUserId = faker.string.uuid()
		const mockUser: User = {
			user_id: mockUserId,
			email: faker.internet.email(),
			name: faker.person.fullName()
		}

		if (!usersStore.has(mockUserId)) {
			usersStore.set(mockUserId, mockUser)
		}

		res.json(mockUser)
	})

	/**
	 * Health check endpoint
	 */
	app.get("/health", (_req, res) => {
		res.json({ status: "ok", timestamp: new Date().toISOString() })
	})

	const server = app.listen(port, () => {
		console.log(`✓ Mock server escuchando en http://localhost:${port}`)
		console.log(`  GET  http://localhost:${port}/health`)
		console.log(`  GET  http://localhost:${port}/libraries`)
		console.log(`  GET  http://localhost:${port}/library/:id`)
		console.log(`  GET  http://localhost:${port}/library/:libraryId/context/:contextId`)
		console.log(`  POST http://localhost:${port}/library/:id/contexts`)
		console.log(`  GET  http://localhost:${port}/organizations`)
		console.log(`  POST http://localhost:${port}/organizations`)
		console.log(`  POST http://localhost:${port}/organizations/:organization_id/users`)
		console.log(`  GET  http://localhost:${port}/organizations/:organization_id/users`)
		console.log(`  DELETE http://localhost:${port}/organizations/:organization_id/users`)
		console.log(`  POST http://localhost:${port}/check-access`)
		console.log(`  GET  http://localhost:${port}/users/me`)
	})

	return { app, server }
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	createMockServer(3002)
}

export default createMockServer
