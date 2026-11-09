# syntax=docker/dockerfile:1

# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first so the package layer is cached until a project file changes.
COPY Admission.sln ./
COPY src/Admission.Api/Admission.Api.csproj src/Admission.Api/
COPY tests/Admission.Tests/Admission.Tests.csproj tests/Admission.Tests/
RUN dotnet restore

COPY . .
RUN dotnet publish src/Admission.Api/Admission.Api.csproj -c Release -o /app --no-restore

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app .
USER app
ENTRYPOINT ["dotnet", "Admission.Api.dll"]
