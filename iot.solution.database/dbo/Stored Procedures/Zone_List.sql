/*******************************************************************
DECLARE @count INT
     	,@output INT = 0
		,@fieldName	VARCHAR(255)

EXEC [dbo].[Zone_List]
	 @companyGuid	= '119B2042-BB90-42A2-9969-6AC3FFBABE6D'
	,@parentEntityGuid	= '119B2042-BB90-42A2-9969-6AC3FFBABE6D'
	,@search		= 'Production'
	,@pageSize		= 10
	,@pageNumber	= 1
	,@orderby		= NULL
	,@count			= @count OUTPUT
	,@invokingUser  = 'C1596B8C-7065-4D63-BFD0-4B835B93DFF2'
	,@version		= 'v1'
	,@output		= @output	OUTPUT
	,@fieldName		= @fieldName	OUTPUT

SELECT @count count, @output status, @fieldName fieldName

001	SEM-4	26-06-2020 [Nishit Khakhi]	Added Initial Version to List Zone 
*******************************************************************/
CREATE PROCEDURE [dbo].[Zone_List]
(   @companyGuid		UNIQUEIDENTIFIER
	,@parentEntityGuid	UNIQUEIDENTIFIER	= NULL
	,@search			VARCHAR(100)		= NULL
	,@pageSize			INT
	,@pageNumber		INT
	,@orderby			VARCHAR(100)		= NULL
	,@invokingUser		UNIQUEIDENTIFIER
	,@version			VARCHAR(10)
	,@culture			VARCHAR(10)			= 'en-Us'
	,@output			SMALLINT			OUTPUT
	,@fieldName			VARCHAR(255)		OUTPUT
	,@count				INT					OUTPUT
	,@enableDebugInfo	CHAR(1)				= '0'
)
AS
BEGIN
    SET NOCOUNT ON

    IF (@enableDebugInfo = 1)
	BEGIN
        DECLARE @Param XML
        SELECT @Param =
        (
            SELECT 'Zone_List' AS '@procName'
            	, CONVERT(VARCHAR(MAX),@companyGuid) AS '@companyGuid'
				, CONVERT(VARCHAR(MAX),@parentEntityGuid) AS '@parentEntityGuid'
				, CONVERT(VARCHAR(MAX),@search) AS '@search'
				, CONVERT(VARCHAR(MAX),@pageSize) AS '@pageSize'
				, CONVERT(VARCHAR(MAX),@pageNumber) AS '@pageNumber'
				, CONVERT(VARCHAR(MAX),@orderby) AS '@orderby'
				, CONVERT(VARCHAR(MAX),@version) AS '@version'
            	, CONVERT(VARCHAR(MAX),@invokingUser) AS '@invokingUser'
            FOR XML PATH('Params')
	    )
	    INSERT INTO DebugInfo(data, dt) VALUES(Convert(VARCHAR(MAX), @Param), GETDATE())
    END
    
    BEGIN TRY

		SET	@output = 1
		SET @count = -1

		IF OBJECT_ID('tempdb..#temp_Entity') IS NOT NULL DROP TABLE #temp_Entity

		CREATE TABLE #temp_Entity
		(	[guid]						UNIQUEIDENTIFIER
			,[parentEntityGuid]			UNIQUEIDENTIFIER
			,[parentEntityName]			NVARCHAR(500)
			,[name]						NVARCHAR(500)
			,[type]						NVARCHAR(100)
			,[isActive]					BIT
			,[totalDevices]				BIGINT
			,[rowNum]					INT
		)

		IF LEN(ISNULL(@orderby, '')) = 0
		SET @orderby = 'name asc'

		DECLARE @Sql nvarchar(MAX) = ''

		SET @Sql = '
		
		SELECT
			*
			,ROW_NUMBER() OVER (ORDER BY '+@orderby+') AS rowNum
		FROM
		(
			SELECT
			L.[guid]
			, L.[parentEntityGuid]
			, P.[name] as [parentEntityName]
			, L.[name]
			, L.[type]
			, L.[isActive]	
			, 0 AS [totalDevices]	

			FROM [dbo].[Entity] AS L WITH (NOLOCK)
			LEFT JOIN [dbo].[Entity] AS P WITH (NOLOCK) ON L.[parentEntityGuid] = P.[guid] AND P.[isDeleted] = 0
			 WHERE L.[companyGuid]=@companyGuid AND L.[parentEntityGuid] IS NOT NULL AND L.[isDeleted]=0 '
			+ CASE WHEN @parentEntityGuid IS NOT NULL THEN ' AND P.[guid] = @parentEntityGuid ' ELSE ' ' END +
			+ CASE WHEN @search IS NULL THEN '' ELSE
			' AND (L.name LIKE ''%' + @search + '%''
			  OR P.name LIKE ''%' + @search + '%'' 
			  OR L.type LIKE ''%' + @search + '%''
			)'
			 END +
		' )  data '
		
		INSERT INTO #temp_Entity
		EXEC sp_executesql 
			  @Sql
			, N'@orderby VARCHAR(100), @companyGuid UNIQUEIDENTIFIER, @parentEntityGuid UNIQUEIDENTIFIER '
			, @orderby		= @orderby			
			, @companyGuid	= @companyGuid		
			, @parentEntityGuid = @parentEntityGuid
		SET @count = @@ROWCOUNT
		
		
		;with CTE_Child 
		AS	(
			SELECT L.[guid] ,COUNT(G.[guid]) [totalCount]
			FROM [dbo].[Device] G (NOLOCK)
			INNER JOIN dbo.[Entity] L ON G.[entityGuid] = L.[guid] 
			WHERE L.[companyGuid] = @companyGuid AND G.[isDeleted] = 0
			GROUP BY L.[guid] 
		)
		UPDATE L
		SET [totalDevices]	= ISNULL(CC.[totalCount],0)
		FROM #temp_Entity L
		LEFT JOIN CTE_Child CC ON L.[guid] = CC.[guid]
		
		IF(@pageSize <> -1 AND @pageNumber <> -1)
			BEGIN
				SELECT 
					L.[guid]
					, L.[parentEntityGuid]
					, L.[parentEntityName]
					, L.[name]
					, L.[type]
					, L.[isActive]
					, L.[totalDevices]	
					
				FROM #temp_Entity L
				WHERE rowNum BETWEEN ((@pageNumber - 1) * @pageSize) + 1 AND (@pageSize * @pageNumber)			
			END
		ELSE
			BEGIN
				SELECT 
				L.[guid]
					, L.[parentEntityGuid]
					, L.[parentEntityName]
					, L.[name]
					, L.[type]
					, L.[isActive]
					, L.[totalDevices]	
				
				FROM #temp_Entity L
			END
	   
        SET @output = 1
		SET @fieldName = 'Success'
	END TRY	
	BEGIN CATCH	
		DECLARE @errorReturnMessage VARCHAR(MAX)

		SET @output = 0

		SELECT @errorReturnMessage = 
			ISNULL(@errorReturnMessage, '') +  SPACE(1)   + 
			'ErrorNumber:'  + ISNULL(CAST(ERROR_NUMBER() as VARCHAR), '')  + 
			'ErrorSeverity:'  + ISNULL(CAST(ERROR_SEVERITY() as VARCHAR), '') + 
			'ErrorState:'  + ISNULL(CAST(ERROR_STATE() as VARCHAR), '') + 
			'ErrorLine:'  + ISNULL(CAST(ERROR_LINE () as VARCHAR), '') + 
			'ErrorProcedure:'  + ISNULL(CAST(ERROR_PROCEDURE() as VARCHAR), '') + 
			'ErrorMessage:'  + ISNULL(CAST(ERROR_MESSAGE() as VARCHAR(max)), '')
		RAISERROR (@errorReturnMessage, 11, 1)  
 
		IF (XACT_STATE()) = -1  
		BEGIN   
			ROLLBACK TRANSACTION 
		END   
		IF (XACT_STATE()) = 1  
		BEGIN      
			ROLLBACK TRANSACTION  
		END   
		RAISERROR (@errorReturnMessage, 11, 1)   
	END CATCH
END